import { api } from "@/trpc/react";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { createParticipantInEncounter } from "@/app/[username]/actions";
import { EncounterUtils } from "@/utils/encounters";
import { ParticipantUtils } from "@/utils/participants";
import { removeUndefinedFields } from "@/app/[username]/utils";
import type { UpsertEncounter } from "@/app/[username]/types";
import { useCampaignId } from "@/app/[username]/[campaign_slug]/campaign_id";
import { useEncounterId } from "@/app/[username]/[campaign_slug]/encounter/[encounter_index]/encounter-id";
import type { ParticipantPost } from "@/app/[username]/[campaign_slug]/encounter/types";
import { getCreaturePostForm } from "@/app/[username]/[campaign_slug]/encounter/utils";
import type { EncounterStatus } from "@/server/api/db/schema";
import { useCampaign } from "@/app/[username]/[campaign_slug]/hooks";
import { useUser } from "@/app/[username]/user-provider";
import { appRoutes } from "@/app/routes";
import { useEncounterUIStore } from "@/encounters/[encounter_index]/EncounterUiStore";
import type { Encounter } from "@/server/api/router";

export function useEncounterLink(status: EncounterStatus) {
  const [encounter] = useEncounter();
  const [campaign] = useCampaign();
  const user = useUser();
  return appRoutes.encounter(campaign, encounter, user, status);
}

export function useEncounter() {
  const currentEncounterId = useEncounterId();

  return api.encounterById.useSuspenseQuery(currentEncounterId);
}

export function useCycleNextTurn() {
  const [encounter] = useEncounter();
  const { encounterById } = api.useUtils();
  const { displayReminders } = useEncounterUIStore();

  return api.cycleNextTurn.useMutation({
    onSettled: async () => {
      return await encounterById.invalidate(encounter.id);
    },
    onMutate: async ({ encounter_id }) => {
      await encounterById.cancel(encounter_id);
      const previousEncounter = encounterById.getData(encounter_id);
      encounterById.setData(encounter_id, (old) => {
        if (!old) return old;
        const { participants, current_round: updatedRoundNumber } =
          EncounterUtils.optimisticParticipants("loadingNext", old);

        if (updatedRoundNumber > encounter.current_round) {
          displayReminders(encounter);
        }

        return { ...old, participants, current_round: updatedRoundNumber };
      });
      return { previousEncounter };
    },
  });
}

export function useCyclePreviousTurn() {
  const [encounter] = useEncounter();
  const { encounterById } = api.useUtils();

  return api.cyclePreviousTurn.useMutation({
    onSettled: async () => {
      return await encounterById.invalidate(encounter.id);
    },
    onMutate: async ({ encounter_id }) => {
      await encounterById.cancel(encounter_id);
      const previousEncounter = encounterById.getData(encounter_id);
      encounterById.setData(encounter_id, (old) => {
        if (!old) return old;
        const { participants, current_round } =
          EncounterUtils.optimisticParticipants("loadingPrevious", old);
        return { ...old, participants, current_round };
      });
      return { previousEncounter };
    },
  });
}

export function useSelectedCreature() {
  const params = useSearchParams();
  const selectedCreature = params.get("selectedCreature");
  return selectedCreature;
}

export function useCreateCreatureInEncounter({
  encounter,
}: {
  encounter: Encounter;
}) {
  const { encounterById } = api.useUtils();
  const id = encounter.id;
  const { invalidateAll, cancelAll } = useEncounterQueryUtils();

  return useMutation({
    mutationFn: async (rawData: ParticipantPost) => {
      if (!encounter) {
        throw new Error("No encounter");
      }
      const formData = getCreaturePostForm(rawData.creature);
      formData.append("encounter_id", encounter.id);
      formData.append(
        "is_ally",
        rawData.participant?.is_ally ? "true" : "false",
      );
      formData.append("column_id", rawData.participant?.column_id ?? "");

      const response = await createParticipantInEncounter(formData);

      if (response.error) {
        console.error(response.error);
        throw new Error("error parsing response");
      }

      if (!response.data) {
        throw new Error("no data in response");
      }

      return response.data;
    },
    onMutate: async (data) => {
      await cancelAll(encounter);
      const previousEncounterData = encounterById.getData(id);
      encounterById.setData(id, (old) => {
        if (!old || !data.participant || !data.creature) {
          console.error(`data missing in createCreatureInEncounter`);
          return;
        }
        return EncounterUtils.addParticipant(
          ParticipantUtils.placeholderParticipantWithData(
            {
              ...data.participant,
              encounter_id: id,
              creature_id: "pending",
            },
            {
              ...data.creature,
              user_id: "pending",
            },
          ),
          old,
        );
      });
      return { previousEncounterData };
    },
    onError: (err, variables, context) => {
      console.error(err);
      if (context?.previousEncounterData) {
        encounterById.setData(id, context.previousEncounterData);
      }
    },
    onSettled: async () => {
      return await invalidateAll(encounter);
    },
  });
}

export function useRemoveParticipantFromEncounter() {
  const id = useEncounterId();
  const {
    encounterById,
    encountersInCampaign: encounters,
    getColumns,
  } = api.useUtils();
  const { mutate: cycleNext } = useCycleNextTurn();

  return api.removeParticipantFromEncounter.useMutation({
    onMutate: async (data) => {
      await encounterById.cancel(id);
      const previousEncounterData = encounterById.getData(id);
      encounterById.setData(id, (old) => {
        if (!old) {
          return;
        }

        const removedParticipant = old.participants.find(
          (p) => p.id === data.participant_id,
        );

        if (!removedParticipant) {
          throw new Error("No participant found when removing");
        }

        if (removedParticipant.is_active) {
          cycleNext({ encounter_id: id });
        }

        return EncounterUtils.removeParticipant(data.participant_id, old);
      });
      return { previousEncounterData };
    },
    onError: (err, variables, context) => {
      if (context?.previousEncounterData) {
        encounterById.setData(id, context.previousEncounterData);
      }
    },
    onSettled: async () => {
      await encounters.invalidate(id);
      await getColumns.invalidate(id);
      return await encounterById.invalidate(id);
    },
  });
}

export function useUpdateEncounterParticipant() {
  const { encounterById } = api.useUtils();
  const id = useEncounterId();
  const { mutate: cycleNext } = useCycleNextTurn();
  return api.updateEncounterParticipant.useMutation({
    onSettled: async () => {
      return await encounterById.invalidate(id);
    },
    onMutate: async (newParticipant) => {
      await encounterById.cancel(id);
      const previousEncounter = encounterById.getData(id);
      encounterById.setData(id, (old) => {
        if (!old) {
          return;
        }

        if (newParticipant.hp <= 0) {
          if (newParticipant.is_active) {
            cycleNext({ encounter_id: id });
          }

          return EncounterUtils.removeParticipant(newParticipant.id, old);
        }

        return EncounterUtils.updateParticipant(newParticipant, old);
      });
      return { previousEncounter };
    },
  });
}

export function useDeleteEncounter() {
  const [campaign] = useCampaign();
  const { encountersInCampaign: encountersQuery } = api.useUtils();
  return api.deleteEncounter.useMutation({
    onSettled: async () => {
      await encountersQuery.invalidate();
    },
    onMutate: async (id) => {
      await encountersQuery.cancel();
      const previous = encountersQuery.getData();
      encountersQuery.setData(campaign.id, (old) => {
        return old?.filter((encounter) => encounter.id !== id);
      });
      return { previous };
    },
  });
}

export function useUpdateEncounter() {
  const { invalidateAll } = useEncounterQueryUtils();
  const campaignId = useCampaignId();

  const mutation = api.updateEncounter.useMutation({
    onSettled: async (en) => {
      if (!en) return;
      return await invalidateAll(en);
    },
  });

  const updateEncounter = (
    encounter: Omit<
      UpsertEncounter,
      "user_id" | "campaign_id" | "index_in_campaign"
    > & {
      id: string;
    },
  ) => {
    mutation.mutate({
      ...removeUndefinedFields(encounter),
      campaign_id: campaignId,
    });
  };

  return { ...mutation, mutate: updateEncounter };
}

export function useUpdateEncounterMinionParticipant() {
  const { encounterById } = api.useUtils();
  const id = useEncounterId();
  return api.updateEncounterMinionParticipant.useMutation({
    onSettled: async () => {
      return await encounterById.invalidate(id);
    },
    onMutate: async (newParticipant) => {
      await encounterById.cancel(id);
      const previousEncounter = encounterById.getData(id);
      encounterById.setData(id, (old) => {
        if (!old) {
          return;
        }
        return EncounterUtils.updateParticipant(newParticipant, old);
      });
      return { previousEncounter };
    },
  });
}

export function useRemoveStatusEffect() {
  const { encounterById } = api.useUtils();
  const id = useEncounterId();
  return api.removeStatusEffect.useMutation({
    onSettled: async () => {
      return await encounterById.invalidate(id);
    },
    onMutate: async (newStatusEffect) => {
      await encounterById.cancel(id);
      const previousEncounter = encounterById.getData(id);
      encounterById.setData(id, (old) => {
        if (!old) return old;
        return {
          ...old,
          participants: old.participants.map((participant) => {
            if (participant.id === newStatusEffect.encounter_participant_id) {
              return {
                ...participant,
                status_effects: participant.status_effects.filter(
                  (effect) => effect.id !== newStatusEffect.status_effect_id,
                ),
              };
            }
            return participant;
          }),
        };
      });
      return previousEncounter;
    },
  });
}

export function useAddExistingCreatureAsParticipant(encounter: Encounter) {
  const id = encounter.id;
  const { cancelAll, invalidateAll } = useEncounterQueryUtils();
  const { encounterById } = api.useUtils();
  const { data: creatures } = api.getUserCreatures.useQuery({ name: "" });
  return api.addExistingCreatureAsParticipant.useMutation({
    onMutate: async (p) => {
      await cancelAll(encounter);
      const previousEncounterData = encounterById.getData(id);
      encounterById.setData(id, (old) => {
        if (!old) {
          return;
        }
        const selectedCreature = creatures?.find(
          (creature) => creature.id === p.creature_id,
        );
        if (!selectedCreature) return;

        // boolean wonkyness comes from the boolean parsing we have to do server side
        // we should always have pure booleans locally
        return EncounterUtils.addParticipant(
          ParticipantUtils.placeholderParticipantWithData(p, {
            ...selectedCreature,
            user_id: "pending",
          }),
          old,
        );
      });
      return { previousEncounterData };
    },
    onError: (err, variables, context) => {
      if (context?.previousEncounterData) {
        encounterById.setData(id, context.previousEncounterData);
      }
    },
    onSettled: async () => {
      return await invalidateAll(encounter);
    },
  });
}

/**
 *
 * A cludgy hook that is needed to make sure that, no matter the source, ui derived from encounter state updates after a mutation to encounters
 */
export function useEncounterQueryUtils() {
  const { encountersInCampaign, getColumns, encounterById, campaignById } =
    api.useUtils();

  const cancelAll = async (encounter: { id: string; campaign_id: string }) => {
    await Promise.all([
      encounterById.cancel(encounter.id),
      getColumns.cancel(encounter.id),
      encountersInCampaign.cancel(encounter.campaign_id),
      campaignById.cancel(encounter.campaign_id),
    ]);
  };

  const invalidateAll = async (encounter: {
    id: string;
    campaign_id: string;
  }) => {
    await Promise.all([
      encounterById.invalidate(encounter.id),
      getColumns.invalidate(encounter.id),
      encountersInCampaign.invalidate(encounter.campaign_id),
      campaignById.invalidate(encounter.campaign_id),
    ]);
  };

  return { cancelAll, invalidateAll };
}

export function useUpdateCreature() {
  const { encounterById } = api.useUtils();
  const id = useEncounterId();
  return api.updateCreature.useMutation({
    onSettled: async () => {
      return await encounterById.invalidate(id);
    },
    onMutate: async (newCreature) => {
      await encounterById.cancel(id);
      const previousEncounter = encounterById.getData(id);
      encounterById.setData(id, (old) => {
        if (!old) {
          return;
        }
        return EncounterUtils.updateCreature(newCreature, old);
      });
      return { previousEncounter };
    },
  });
}

export function useStartEncounter() {
  const { encounterById } = api.useUtils();
  const id = useEncounterId();

  return api.startEncounter.useMutation({
    onSettled: async () => {
      return await encounterById.invalidate(id);
    },
    onMutate: async () => {
      await encounterById.cancel(id);
      const previousEncounter = encounterById.getData(id);
      encounterById.setData(id, (old) => {
        if (!old) return old;
        const [firstActive, firstRoundNumber] =
          EncounterUtils.firstActiveAndRoundNumber(old);

        const newEncounter = EncounterUtils.updateParticipant(
          { ...firstActive, is_active: true },
          { ...old, current_round: firstRoundNumber },
        );

        return { ...newEncounter, status: "run" };
      });
      return { previousEncounter };
    },
  });
}
