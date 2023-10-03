"use client";

import { CharacterIcon } from "@/app/dashboard/encounters/[id]/character-icon";
import { CustomCreature } from "@/app/dashboard/encounters/[id]/creature-add-form";
import {
  useCreateCreature,
  useDeleteCreature,
  useUserCreatures,
} from "@/app/dashboard/encounters/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function CreaturesPage() {
  const [name, setName] = useState("");
  const { data: creatures } = useUserCreatures(name);
  const { mutate: deleteCreature } = useDeleteCreature();
  const { mutate: addCreature, isLoading } = useCreateCreature();
  const [addingCreature, setAddingCreature] = useState(false);
  return (
    <div className="flex flex-col gap-10 ">
      <h1 className="text-3xl">Creatures</h1>

      <div className={"flex gap-5 relative"}>
        <Input
          placeholder="Search"
          className={"max-w-lg"}
          type="text"
          onChange={(e) => setName(e.target.value)}
          value={name}
        />
        <Button onClick={() => setAddingCreature(true)}>Add Creature</Button>
        {addingCreature ? (
          <Card
            id="creature-add-form"
            className={`max-w-sm p-5 w-full h-fit flex flex-col gap-5`}
          >
            <CustomCreature
              onSuccess={() => setAddingCreature(false)}
              mutation={{
                onAddCreature: addCreature,
                isLoading,
              }}
            >
              <Button
                variant="ghost"
                className={"justify-self-center self-center"}
                onClick={() => setAddingCreature(false)}
              >
                Cancel
              </Button>
            </CustomCreature>
          </Card>
        ) : null}
      </div>

      <span className={!name ? "opacity-100" : "opacity-0"}>
        {creatures?.length} / 30
      </span>
      <div className="flex gap-5 flex-wrap">
        {creatures?.map((creature) => (
          <Card
            key={creature.id}
            className={"p-8 flex flex-col gap-3 relative"}
          >
            <h2>{creature.name}</h2>
            <CharacterIcon id={creature.id} name={creature.name} />
          </Card>
        ))}
      </div>
    </div>
  );
}
