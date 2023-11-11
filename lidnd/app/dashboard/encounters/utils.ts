import { CreaturePost } from "@/app/dashboard/encounters/[id]/creature-add-form";
import {
  EncounterParticipant,
  Creature,
  EncounterCreature,
  Encounter,
} from "@/server/api/router";
import { Part } from "@aws-sdk/client-s3";

export function getAWSimageURL(
  creature_id: string,
  type: "icon" | "stat_block"
): string {
  return `https://dnd-init-tracker-icons-stats.s3.us-west-1.amazonaws.com/${type}-${creature_id}.png`;
}

export function sortEncounterCreatures<
  T extends { initiative: number; created_at: Date; id: string },
>(a: T, b: T) {
  return (
    b.initiative - a.initiative ||
    a.created_at.getTime() - b.created_at.getTime() ||
    a.id.localeCompare(b.id)
  );
}

export type UpdateTurnOrderReturn<T> = {
  updatedParticipants: T[];
  updatedRoundNumber: number;
  newlyActiveParticipant: T;
};

export function updateTurnOrder<
  Participant extends {
    is_active: boolean;
    hp: number;
    id: string;
    initiative: number;
    created_at: Date;
    is_player: boolean;
    has_surprise: boolean;
  },
>(
  to: "next" | "previous",
  participants: Participant[],
  encounter: { current_round: number }
): UpdateTurnOrderReturn<Participant> {
  let sortedParticipants = participants.slice().sort(sortEncounterCreatures);
  if (!sortedParticipants.some((p) => p.is_active)) {
    sortedParticipants[0].is_active = true;
  }
  const encounterHasSurpriseRound = participants.some((p) => p.has_surprise);
  const isSurpriseRound =
    encounter?.current_round === 0 && encounterHasSurpriseRound;

  let activeParticipants;

  function participantIsActivatable(p: Participant) {
    // if the active player is dead, we have to keep them in the order until the turn changes.
    // a rare occurrence, but possible.
    // Player characters are always active. Since their HP is default 0, we have to exempt them.
    return p.hp > 0 || p.is_active || p.is_player;
  }

  if (isSurpriseRound) {
    activeParticipants = sortedParticipants.filter((c) => c.has_surprise);
  } else {
    activeParticipants = sortedParticipants.filter(participantIsActivatable);
  }
  let nextActiveIndex: number;
  const previousActiveIndex = activeParticipants.findIndex((c) => c.is_active);

  let currentRound = encounter.current_round;
  if (to === "previous") {
    nextActiveIndex =
      (previousActiveIndex - 1 + activeParticipants.length) %
      activeParticipants.length;
    if (nextActiveIndex >= previousActiveIndex && currentRound > 0) {
      if (encounter.current_round === 1 && encounterHasSurpriseRound) {
        // we wrap back into surprise
        nextActiveIndex = -1;
        activeParticipants = sortedParticipants.filter((c) => c.has_surprise);
      }
      currentRound--;
    }
  } else {
    nextActiveIndex = (previousActiveIndex + 1) % activeParticipants.length;
    if (nextActiveIndex <= previousActiveIndex) {
      if (isSurpriseRound) {
        // we wrap back into normal
        nextActiveIndex = 0;
        activeParticipants = sortedParticipants.filter(
          participantIsActivatable
        );
      }
      currentRound++;
    }
  }
  const activeParticipant = activeParticipants.at(nextActiveIndex);
  if (!activeParticipant) {
    throw new Error("No active participant found");
  }
  sortedParticipants = sortedParticipants.map((p) => {
    if (p.id === activeParticipant?.id) {
      return {
        ...p,
        is_active: true,
      };
    } else {
      return {
        ...p,
        is_active: false,
      };
    }
  });
  return {
    updatedParticipants: sortedParticipants,
    updatedRoundNumber: currentRound,
    newlyActiveParticipant: activeParticipant,
  };
}

export function getCreaturePostForm(creature: CreaturePost): FormData {
  const formData = new FormData();
  formData.append("name", creature.name);
  formData.append("max_hp", creature.max_hp?.toString() || "");
  formData.append("icon_image", creature.icon_image);
  formData.append("stat_block_image", creature.stat_block_image);
  formData.append(
    "challenge_rating",
    creature.challenge_rating?.toString() || ""
  );
  formData.append("is_player", creature.is_player?.toString() || "");
  return formData;
}
export function mergeEncounterCreature(
  participant: EncounterParticipant,
  creature: Creature
): EncounterCreature {
  return {
    id: participant.id,
    encounter_id: participant.encounter_id,
    creature_id: participant.creature_id,
    name: creature.name,
    challenge_rating: creature.challenge_rating,
    max_hp: creature.max_hp,
    hp: participant.hp,
    is_active: participant.is_active,
    is_player: creature.is_player,
    initiative: participant.initiative,
    created_at: participant.created_at,
    user_id: creature.user_id,
    has_surprise: participant.has_surprise,
  };
}
