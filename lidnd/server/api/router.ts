import { createContext } from "@/server/api/context";
import { TRPCError, initTRPC } from "@trpc/server";
import {
  encounters,
  participants,
  creatures,
  settings,
  participant_status_effects,
  status_effects,
  spells,
} from "@/server/api/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { db } from "@/server/api/db";
import superjson from "superjson";
import { ZodError, z } from "zod";
import {
  updateGroupTurn,
  updateMinionCount,
  cycleNextTurn,
  cyclePreviousTurn,
} from "@/app/dashboard/campaigns/[campaign]/encounters/utils";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  getEncounterCreature,
  getEncounterParticipants,
  getEncounterParticipantsWithCreatureData,
  getIconAWSname,
  getStatBlockAWSname,
  postEncounterToUserChannel,
  setActiveParticipant,
  updateParticipantHasPlayed,
  updateTurnData,
} from "@/server/api/utils";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  campaignEncounters,
  encounterById,
  encounterReminders,
  EncounterWithData,
} from "@/server/encounters";
import {
  campaignById,
  playersInCampaign,
  userCampaigns,
} from "@/server/campaigns";
import { booleanSchema } from "@/app/dashboard/utils";

const t = initTRPC.context<typeof createContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

const isAuthed = t.middleware((opts) => {
  const { ctx } = opts;
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You are not on the whitelist.",
    });
  }
  return opts.next({
    ctx: {
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
export const publicProcedure = t.procedure;

export type Encounter = typeof encounters.$inferSelect;
export type Creature = typeof creatures.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type StatusEffect = typeof status_effects.$inferSelect;
export type ParticipantStatusEffect =
  typeof participant_status_effects.$inferSelect & {
    description: StatusEffect["description"];
    name: StatusEffect["name"];
  };

export type ParticipantCreature = EncounterWithData["participants"][number];
export type EncounterWithParticipants = Encounter & {
  participants: ParticipantCreature[];
};

export const participantSchema = createSelectSchema(participants);
export const insertCreatureSchema = createInsertSchema(creatures);
export const insertSettingsSchema = createInsertSchema(settings);
export const updateEncounterSchema = createInsertSchema(encounters);
export const participantInsertSchema = createInsertSchema(participants);

export const creatureUploadSchema = insertCreatureSchema
  .extend({
    icon_image: z.any(),
    stat_block_image: z.unknown().optional(),
    max_hp: z.coerce.number(),
    challenge_rating: z.coerce.number(),
    is_player: booleanSchema,
  })
  .omit({ user_id: true });

export const updateSettingsSchema = insertSettingsSchema
  .omit({ user_id: true })
  .merge(
    z.object({
      show_health_in_discord: booleanSchema,
      show_icons_in_discord: booleanSchema,
      average_turn_seconds: z.coerce.number(),
      default_player_level: z.coerce.number(),
    })
  );

export const appRouter = t.router({
  encounters: protectedProcedure.input(z.string()).query(async (opts) => {
    const userId = opts.ctx.user.userId;
    const campaignId = opts.input;

    return await campaignEncounters(userId, campaignId);
  }),

  spells: publicProcedure.input(z.string()).query(async (opts) => {
    return await db
      .select()
      .from(spells)
      .where(ilike(spells.name, `%${opts.input}%`))
      .limit(10);
  }),

  statusEffects: publicProcedure.query(async () => {
    return await db.select().from(status_effects);
  }),

  encounterById: protectedProcedure.input(z.string()).query(async (opts) => {
    const encounter = await encounterById(opts.ctx.user.userId, opts.input);
    if (!encounter) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No encounter found",
      });
    }
    return encounter;
  }),

  deleteEncounter: protectedProcedure
    .input(z.string())
    .mutation(async (opts) => {
      return await db
        .delete(encounters)
        .where(
          and(
            eq(encounters.id, opts.input),
            eq(encounters.user_id, opts.ctx.user.userId)
          )
        )
        .returning();
    }),

  userCampaigns: protectedProcedure.query(async (opts) => {
    const userId = opts.ctx.user.userId;
    return await userCampaigns(userId);
  }),

  campaignById: protectedProcedure.input(z.string()).query(async (opts) => {
    const campaign = await campaignById(opts.input, opts.ctx.user.userId);
    if (!campaign) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No campaign found",
      });
    }
    return campaign;
  }),

  createEncounter: protectedProcedure
    .input(
      z.object({
        name: z.string().nullable(),
        description: z.string().nullable(),
        campaign_id: z.string(),
      })
    )
    .mutation(async (opts) => {
      return await db.transaction(async (tx) => {
        const [encounter, campaignPlayers] = await Promise.all([
          tx
            .insert(encounter)
            .values({
              name: opts.input.name,
              description: opts.input.description,
              user_id: opts.ctx.user.userId,
              campaign_id: opts.input.campaign_id,
            })
            .returning(),
          playersInCampaign(opts.input.campaign_id, opts.ctx.user.userId, tx),
        ]);
        if (encounter.length === 0) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create encounter",
          });
        }
        if (campaignPlayers.length > 0) {
          await tx.insert(participants).values(
            campaignPlayers.map(({ player }) => ({
              encounter_id: encounter[0].id,
              creature_id: player.id,
            }))
          );
        }

        return encounter[0];
      });
    }),

  updateEncounter: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
      })
    )
    .mutation(async (opts) => {
      const result = await db
        .update(encounters)
        .set({
          name: opts.input.name,
          description: opts.input.description,
        })
        .where(
          and(
            eq(encounters.id, opts.input.id),
            eq(encounters.user_id, opts.ctx.user.userId)
          )
        )
        .returning();
      if (result.length === 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update encounter",
        });
      }
      return result[0];
    }),

  updateEncounterMinionParticipant: protectedProcedure
    .input(
      participantSchema.merge(
        z.object({
          minion_count: z.number(),
          minions_in_overkill_range: z.number(),
          damage: z.number(),
        })
      )
    )
    .mutation(async (opts) => {
      const result = await db.transaction(async (tx) => {
        const participant = await getEncounterCreature(opts.input.id);
        const updatedMinionCount = updateMinionCount(
          participant,
          opts.input.minions_in_overkill_range,
          opts.input.damage
        );
        console.log(opts.input);
        const [updatedParticipant, _] = await Promise.all([
          await tx
            .update(participant)
            .set({
              minion_count: updatedMinionCount,
              hp: participant.max_hp,
            })
            .where(eq(participant.id, opts.input.id))
            .returning(),
          encounterById(opts.ctx.user.userId, opts.input.encounter_id, tx),
        ]);
        if (updatedParticipant.length === 0) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update encounter participant",
          });
        }
        return updatedParticipant[0];
      });
      return result;
    }),

  updateEncounterParticipant: protectedProcedure
    .input(participantSchema)
    .mutation(async (opts) => {
      const result = await db.transaction(async (tx) => {
        const [updatedParticipant, _] = await Promise.all([
          await tx
            .update(participants)
            .set(opts.input)
            .where(eq(participants.id, opts.input.id))
            .returning(),
          encounterById(opts.ctx.user.userId, opts.input.encounter_id, tx),
        ]);
        if (updatedParticipant.length === 0) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update encounter participant",
          });
        }
        return updatedParticipant[0];
      });
      return result;
    }),

  removeStatusEffect: protectedProcedure
    .input(
      z.object({
        encounter_participant_id: z.string(),
        status_effect_id: z.string(),
      })
    )
    .mutation(async (opts) => {
      const result = await db
        .delete(participant_to_effect)
        .where(
          and(
            eq(
              participant_to_effect.encounter_participant_id,
              opts.input.encounter_participant_id
            ),
            eq(
              participant_to_effect.status_effect_id,
              opts.input.status_effect_id
            )
          )
        )
        .returning();
      if (result.length === 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove status effect",
        });
      }
      return result[0];
    }),

  assignStatusEffect: protectedProcedure
    .input(
      z.object({
        encounter_participant_id: z.string(),
        status_effect_id: z.string(),
        duration: z.number().optional(),
        save_ends_dc: z.number().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async (opts) => {
      const result = await db
        .insert(participant_to_effect)
        .values({
          encounter_participant_id: opts.input.encounter_participant_id,
          status_effect_id: opts.input.status_effect_id,
          duration: opts.input.duration,
          save_ends_dc: opts.input.save_ends_dc,
        })
        .returning();
      if (result.length === 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to assign status effect",
        });
      }
      return result[0];
    }),

  startEncounter: protectedProcedure
    .input(z.string())
    .mutation(async (opts) => {
      const result = await db.transaction(async (tx) => {
        const [encounter, encounterParticipants] = await Promise.all([
          encounterById(opts.ctx.user.userId, opts.input, tx),
          getEncounterParticipants(opts.input, tx),
        ]);

        const surpriseRoundExists = encounterParticipants.some(
          (p) => p.has_surprise
        );

        let activeParticipant: Participant;
        if (surpriseRoundExists) {
          activeParticipant = encounterParticipants.find(
            (p) => p.has_surprise
          )!;
        } else {
          activeParticipant = encounterParticipants[0];
        }
        await Promise.all([
          tx
            .update(participants)
            .set({
              is_active: true,
            })
            .where(
              and(
                eq(participants.encounter_id, opts.input),
                eq(participants.id, activeParticipant.id)
              )
            ),
          tx
            .update(encounter)
            .set({
              started_at: new Date(),
              current_round: surpriseRoundExists ? 0 : 1,
            })
            .where(eq(encounter.id, opts.input)),
        ]);
        return encounter;
      });
      if (!result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to start encounter",
        });
      }
      await postEncounterToUserChannel(result);
      return result;
    }),

  cycleNextTurn: protectedProcedure
    .input(
      z.object({
        encounter_id: z.string(),
      })
    )
    .mutation(async (opts) => {
      const result = await db.transaction(async (tx) => {
        const encounter = await encounterById(
          opts.ctx.user.userId,
          opts.input.encounter_id
        );

        if (!encounter) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "No encounter found",
          });
        }

        const { newlyActiveParticipant, updatedRoundNumber } =
          cycleNextTurn(encounter);

        await updateTurnData(
          opts.input.encounter_id,
          updatedRoundNumber,
          newlyActiveParticipant.id,
          tx
        );
        return encounter;
      });
      return result;
    }),

  cyclePreviousTurn: protectedProcedure
    .input(
      z.object({
        encounter_id: z.string(),
      })
    )
    .mutation(async (opts) => {
      const result = await db.transaction(async (tx) => {
        const encounter = await encounterById(
          opts.ctx.user.userId,
          opts.input.encounter_id
        );

        if (!encounter) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "No encounter found",
          });
        }

        const { newlyActiveParticipant, updatedRoundNumber } =
          cyclePreviousTurn(encounter);

        await updateTurnData(
          opts.input.encounter_id,
          updatedRoundNumber,
          newlyActiveParticipant.id,
          tx
        );
        return encounter;
      });
      return result;
    }),

  updateGroupTurn: protectedProcedure
    .input(
      z.object({
        encounter_id: z.string(),
        participant_id: z.string(),
        has_played_this_round: z.boolean(),
      })
    )
    .mutation(async (opts) => {
      const result = await db.transaction(async (tx) => {
        const [encounter, encounterParticipants] = await Promise.all([
          encounterById(opts.ctx.user.userId, opts.input.encounter_id, tx),
          getEncounterParticipantsWithCreatureData(opts.input.encounter_id, tx),
        ]);

        const { updatedParticipants, updatedRoundNumber } = updateGroupTurn(
          opts.input.participant_id,
          opts.input.has_played_this_round,
          encounterParticipants,
          encounter
        );

        await Promise.all([
          ...updatedParticipants.map((p) => updateParticipantHasPlayed(p, tx)),
          tx
            .update(encounter)
            .set({
              current_round: updatedRoundNumber,
            })
            .where(eq(encounter.id, opts.input.encounter_id)),
        ]);
        return encounter;
      });
      return result;
    }),

  removeParticipantFromEncounter: protectedProcedure
    .input(
      z.object({
        encounter_id: z.string(),
        participant_id: z.string(),
      })
    )
    .mutation(async (opts) => {
      const encounter = await encounterById(
        opts.ctx.user.userId,
        opts.input.encounter_id
      );

      if (!encounter) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No encounter found",
        });
      }

      const result = await db
        .delete(participants)
        .where(
          and(
            eq(participants.encounter_id, opts.input.encounter_id),
            eq(participants.id, opts.input.participant_id)
          )
        )
        .returning();

      if (result.length === 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove participant from encounter",
        });
      }

      if (result[0].is_active) {
        const { newlyActiveParticipant } = cycleNextTurn(encounter);

        setActiveParticipant(
          newlyActiveParticipant.id,
          opts.input.encounter_id
        );
      }
      return result[0];
    }),

  addExistingCreatureToEncounter: protectedProcedure
    .input(
      z.object({
        encounter_id: z.string(),
        creature_id: z.string(),
        is_ally: booleanSchema,
      })
    )
    .mutation(async (opts) => {
      const [userCreature, _] = await Promise.all([
        db
          .select()
          .from(creatures)
          .where(
            and(
              eq(creatures.id, opts.input.creature_id),
              eq(creatures.user_id, opts.ctx.user.userId)
            )
          ),
        encounterById(opts.ctx.user.userId, opts.input.encounter_id),
      ]);
      if (userCreature.length === 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No creature found",
        });
      }
      const encounterParticipant = await db
        .insert(participants)
        .values({
          encounter_id: opts.input.encounter_id,
          creature_id: opts.input.creature_id,
          hp: userCreature[0].max_hp,
          is_ally: opts.input.is_ally,
        })
        .returning();
      if (encounterParticipant.length === 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add creature to encounter",
        });
      }
      return encounterParticipant[0];
    }),

  updateCreature: protectedProcedure
    .input(insertCreatureSchema.omit({ user_id: true }))
    .mutation(async (opts) => {
      if (!opts.input.id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No creature id in reqquest",
        });
      }
      const result = await db
        .update(creatures)
        .set(opts.input)
        .where(
          and(
            eq(creatures.id, opts.input.id),
            eq(creatures.user_id, opts.ctx.user.userId)
          )
        )
        .returning();
      if (result.length === 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update creature",
        });
      }
      return result[0];
    }),

  deleteCreature: protectedProcedure
    .input(z.string())
    .mutation(async (opts) => {
      const deletedCreature = await db
        .delete(creatures)
        .where(
          and(
            eq(creatures.id, opts.input),
            eq(creatures.user_id, opts.ctx.user.userId)
          )
        )
        .returning();
      if (deletedCreature.length === 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete creature",
        });
      }
      const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
      try {
        await Promise.all([
          s3Client.send(
            new DeleteObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME!,
              Key: getIconAWSname(deletedCreature[0].id),
            })
          ),
          s3Client.send(
            new DeleteObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME!,
              Key: getStatBlockAWSname(deletedCreature[0].id),
            })
          ),
        ]);
      } catch (e) {
        console.error(e);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete images",
        });
      }
      return deletedCreature[0];
    }),

  getUserCreatures: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        is_player: z.boolean().optional(),
      })
    )
    .query(async (opts) => {
      const filters = [eq(creatures.user_id, opts.ctx.user.userId)];
      if (opts.input.name) {
        filters.push(ilike(creatures.name, `%${opts.input.name}%`));
      }
      if (opts.input.is_player) {
        filters.push(eq(creatures.is_player, opts.input.is_player));
      }
      return await db
        .select()
        .from(creatures)
        .where(and(...filters));
    }),

  settings: protectedProcedure.query(async (opts) => {
    opts.ctx.user.userId;
    const userSettings = await db
      .select()
      .from(settings)
      .where(eq(settings.user_id, opts.ctx.user.userId));
    if (userSettings.length === 0) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No settings found",
      });
    }
    return userSettings[0];
  }),

  updateSettings: protectedProcedure
    .input(updateSettingsSchema)
    .mutation(async (opts) => {
      const result = await db
        .update(settings)
        .set(opts.input)
        .where(eq(settings.user_id, opts.ctx.user.userId))
        .returning();
      if (result.length === 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update settings",
        });
      }
      return result[0];
    }),

  encounterReminders: protectedProcedure
    .input(z.string())
    .query(async (opts) => {
      const user = opts.ctx.user;
      return await encounterReminders(user.userId, opts.input);
    }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
