"use client";

import React, { Suspense, useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { useEncounterId } from "@/app/dashboard/encounters/hooks";
import { Button } from "@/components/ui/button";
import { CharacterIcon } from "@/app/dashboard/encounters/[id]/character-icon";
import { Spinner } from "@/components/ui/spinner";
import { UseMutateFunction } from "@tanstack/react-query";
import * as z from "zod";
import { Card, CardContent } from "@/components/ui/card";
import clsx from "clsx";
import {
  Creature,
  EncounterCreature,
  creatureUploadSchema,
  insertCreatureSchema,
} from "@/server/api/router";
import { api } from "@/trpc/react";

export type CreaturePost = z.infer<typeof creatureUploadSchema>;

export function CustomCreature({
  children,
  onSuccess,
  mutation,
}: {
  children?: React.ReactNode;
  onSuccess?: () => void;
  mutation: {
    onAddCreature: UseMutateFunction<any, unknown, CreaturePost, unknown>;
    isPending: boolean;
  };
  formFields?: React.ReactNode;
}) {
  const [creatureData, setCreatureData] = useState({
    name: "",
    max_hp: "",
    icon: new File([], ""),
    stat_block: new File([], ""),
  });

  return (
    <>
      {mutation.isPending ? "Loading..." : null}
      <Input
        placeholder="Name"
        type="text"
        onChange={(e) =>
          setCreatureData({ ...creatureData, name: e.target.value })
        }
        value={creatureData.name}
      />
      <Input
        placeholder="Max hp"
        type="text"
        onChange={(e) =>
          setCreatureData({
            ...creatureData,
            max_hp: !isNaN(parseInt(e.target.value)) ? e.target.value : "",
          })
        }
        value={creatureData.max_hp}
      />
      <ImageUpload
        onUpload={(file) =>
          file ? setCreatureData({ ...creatureData, icon: file }) : null
        }
      />

      <ImageUpload
        onUpload={(file) =>
          file ? setCreatureData({ ...creatureData, stat_block: file }) : null
        }
      />

      <div className={"flex gap-5"}>
        {children}
        <Button
          className="p-5 border m-auto"
          variant={"outline"}
          onClick={(e) => {
            e.stopPropagation();
            if (
              !isNaN(parseInt(creatureData.max_hp)) &&
              creatureData.name &&
              creatureData.stat_block &&
              creatureData.icon
            ) {
              mutation.onAddCreature({
                name: creatureData.name,
                icon_image: creatureData.icon,
                max_hp: parseInt(creatureData.max_hp),
                stat_block_image: creatureData.stat_block,
                challenge_rating: 0,
                is_player: false,
              });
            } else {
              alert("Please fill out all fields");
            }
          }}
        >
          + Add creature
        </Button>
      </div>
    </>
  );
}

export function ImageUpload({ onUpload }: { onUpload: (file?: File) => void }) {
  const [hasContent, setHasContent] = React.useState(false);
  return (
    <span className="h-auto relative flex flex-col gap-5 items-center justify-center group">
      <span className="flex flex-wrap gap-2 items-center relative rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
        <Input
          type={"file"}
          disabled={hasContent}
          className="max-w-sm"
          accept="image/png, image/jpeg, image/jpg"
          onChange={(e) => {
            if (e.target.files) {
              onUpload(e.target.files[0]);
            }
          }}
        />
        <div
          className={"w-full outline-none text-2xl"}
          contentEditable
          onPaste={(e) => {
            const clipboardData = e.clipboardData;
            const item = clipboardData.items[0];

            if (!item?.type.startsWith("image")) {
              e.preventDefault();
              return;
            }
            onUpload(item.getAsFile() ?? undefined);
            setHasContent(true);
          }}
          onKeyDown={(e) => {
            setHasContent(e.currentTarget.textContent?.trim() !== "");
          }}
        />
      </span>
    </span>
  );
}

export function ExistingCreature({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const [name, setName] = useState("");
  const id = useEncounterId();
  const { encounterById } = api.useUtils();
  const optimisticId = useId();

  const { data: creatures, isLoading: isLoadingCreatures } =
    api.getUserCreatures.useQuery({
      name,
    });
  const { mutate: addCreature, isLoading: isAddingExistingCreature } =
    api.addExistingCreatureToEncounter.useMutation({
      onMutate: async ({ creature_id }) => {
        await encounterById.cancel(id);
        const previousEncounterData = encounterById.getData(id);
        encounterById.setData(id, (old) => {
          if (!old) {
            return;
          }
          const selectedCreature = creatures?.find(
            (creature) => creature.id === creature_id
          );
          if (!selectedCreature) return;
          const newParticipant: EncounterCreature = {
            encounter_id: old.id,
            creature_id: creature_id,
            id: optimisticId,
            initiative: 0,
            hp: selectedCreature.max_hp,
            name: selectedCreature.name,
            challenge_rating: selectedCreature.challenge_rating,
            max_hp: selectedCreature.max_hp,
            is_player: selectedCreature.is_player,
            is_active: false,
            created_at: new Date(),
            user_id: old.user_id,
          };
          return {
            ...old,
            participants: [...old.participants, newParticipant],
          };
        });
        return { previousEncounterData };
      },
      onError: (err, variables, context) => {
        if (context?.previousEncounterData) {
          encounterById.setData(id, context.previousEncounterData);
        }
      },
      onSettled: () => {
        encounterById.invalidate(id);
      },
    });

  return (
    <>
      <Input
        placeholder="Search..."
        type="text"
        onChange={(e) => setName(e.target.value)}
        value={name}
      />
      <Suspense key={name} fallback={<div>Loading creatures</div>}>
        <ExistingCreatureOptions name={name} addCreature={addCreature} />
      </Suspense>

      <div className={"flex gap-5"}>{children}</div>
    </>
  );
}

function ExistingCreatureOptions({
  name,
  addCreature,
}: {
  name: string;
  addCreature: ({
    creature_id,
    encounter_id,
  }: {
    creature_id: string;
    encounter_id: string;
  }) => void;
}) {
  const id = useEncounterId();
  const [creatures, creaturesQuery] = api.getUserCreatures.useSuspenseQuery({
    name,
  });
  return (
    <div className={"flex flex-col gap-2"}>
      {creatures?.map((creature) => (
        <button
          key={creature.id}
          onClick={(e) => {
            e.stopPropagation();
            addCreature({
              creature_id: creature.id,
              encounter_id: id,
            });
          }}
        >
          <Card
            className={clsx(
              "flex hover:bg-gray-100 transition-all items-center gap-10 overflow-hidden"
            )}
          >
            <CharacterIcon
              id={creature.id}
              name={creature.name}
              className={"w-50 h-50"}
            />
            <section className="text-xl flex gap-3 flex-col w-full h-full justify-start">
              <span>{creature.name}</span>
              <section className="text-lg flex gap-3">
                <span>CR: {creature.challenge_rating}</span>
                <span>HP: {creature.max_hp}</span>
              </section>
            </section>
          </Card>
        </button>
      ))}
    </div>
  );
}
