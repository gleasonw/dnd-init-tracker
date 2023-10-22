"use client";

import { BasePopover } from "@/app/dashboard/base-popover";
import { CharacterIcon } from "@/app/dashboard/encounters/[id]/character-icon";
import { CustomCreature } from "@/app/dashboard/encounters/[id]/creature-add-form";
import {
  useCreateCreature,
  useDeleteCreature,
  useUserCreatures,
} from "@/app/dashboard/encounters/api";
import { FullCreatureAddForm } from "@/app/dashboard/full-creature-add-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";

export default function CreaturesPage() {
  const [name, setName] = useState("");
  const { data: creatures } = useUserCreatures(name);
  const { mutate: deleteCreature } = useDeleteCreature();
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
        <BasePopover
          trigger={<Button>Add Custom Creature</Button>}
          className="w-[600px]"
        >
          <FullCreatureAddForm />
        </BasePopover>
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
            <BasePopover
              trigger={
                <Button variant="ghost" size="icon" className="absolute top-0 right-0">
                  <MoreHorizontal />
                </Button>
              }
              className={'w-fit'}
            >
              <Button
                variant="destructive"
                onClick={() => deleteCreature(creature.id)}
              >
                Delete
              </Button>
            </BasePopover>
            <h2>{creature.name}</h2>
            <CharacterIcon id={creature.id} name={creature.name} />
          </Card>
        ))}
      </div>
    </div>
  );
}
