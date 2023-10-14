/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */


export interface paths {
  "/": {
    /** Read Root */
    get: operations["read_root__get"];
  };
  "/api/encounters": {
    /** Get User Encounters */
    get: operations["get_user_encounters_api_encounters_get"];
    /** Create Encounter */
    post: operations["create_encounter_api_encounters_post"];
  };
  "/api/encounters/{encounter_id}": {
    /** Get User Encounter By Id */
    get: operations["get_user_encounter_by_id_api_encounters__encounter_id__get"];
    /** Update Encounter */
    put: operations["update_encounter_api_encounters__encounter_id__put"];
    /** Delete Encounter */
    delete: operations["delete_encounter_api_encounters__encounter_id__delete"];
  };
  "/api/encounters/{encounter_id}/turn": {
    /** Update Turn */
    post: operations["update_turn_api_encounters__encounter_id__turn_post"];
  };
  "/api/encounters/{encounter_id}/creatures/{creature_id}": {
    /** Update Encounter Creature */
    put: operations["update_encounter_creature_api_encounters__encounter_id__creatures__creature_id__put"];
    /** Add Existing Creature To Encounter */
    post: operations["add_existing_creature_to_encounter_api_encounters__encounter_id__creatures__creature_id__post"];
    /** Remove Creature From Encounter */
    delete: operations["remove_creature_from_encounter_api_encounters__encounter_id__creatures__creature_id__delete"];
  };
  "/api/encounters/{encounter_id}/start": {
    /** Start Encounter */
    post: operations["start_encounter_api_encounters__encounter_id__start_post"];
  };
  "/api/encounters/{encounter_id}/stop": {
    /** Stop Encounter */
    post: operations["stop_encounter_api_encounters__encounter_id__stop_post"];
  };
  "/api/encounters/{encounter_id}/creatures": {
    /** Get Encounter Creatures */
    get: operations["get_encounter_creatures_api_encounters__encounter_id__creatures_get"];
    /** Add Creature To Encounter */
    post: operations["add_creature_to_encounter_api_encounters__encounter_id__creatures_post"];
  };
  "/api/creatures/{creature_id}": {
    /** Get User Creature */
    get: operations["get_user_creature_api_creatures__creature_id__get"];
    /** Update Creature */
    put: operations["update_creature_api_creatures__creature_id__put"];
    /** Delete Creature */
    delete: operations["delete_creature_api_creatures__creature_id__delete"];
  };
  "/api/creatures": {
    /** Get User Creatures */
    get: operations["get_user_creatures_api_creatures_get"];
    /** Create Creature */
    post: operations["create_creature_api_creatures_post"];
  };
  "/api/discord-channel": {
    /** Get Discord Channel */
    get: operations["get_discord_channel_api_discord_channel_get"];
  };
  "/api/discord-settings": {
    /** Get Discord Settings */
    get: operations["get_discord_settings_api_discord_settings_get"];
    /** Update Discord Settings */
    put: operations["update_discord_settings_api_discord_settings_put"];
  };
}

export type webhooks = Record<string, never>;

export interface components {
  schemas: {
    /** Body_add_creature_to_encounter_api_encounters__encounter_id__creatures_post */
    Body_add_creature_to_encounter_api_encounters__encounter_id__creatures_post: {
      /** Name */
      name: string;
      /** Max Hp */
      max_hp: number;
      /**
       * Icon
       * Format: binary
       */
      icon: string;
      /**
       * Stat Block
       * Format: binary
       */
      stat_block: string;
    };
    /** Body_create_creature_api_creatures_post */
    Body_create_creature_api_creatures_post: {
      /** Name */
      name: string;
      /** Max Hp */
      max_hp: number;
      /**
       * Icon
       * Format: binary
       */
      icon: string;
      /**
       * Stat Block
       * Format: binary
       */
      stat_block: string;
    };
    /** CreatureRequest */
    CreatureRequest: {
      /** Name */
      name: string;
      /**
       * Icon
       * Format: binary
       */
      icon: string;
      /**
       * Stat Block
       * Format: binary
       */
      stat_block: string;
      /** Max Hp */
      max_hp: number;
    };
    /** CreatureResponse */
    CreatureResponse: {
      /** Id */
      id: number;
      /** Name */
      name: string;
      /** Max Hp */
      max_hp: number;
    };
    /** DiscordEncounterSettings */
    DiscordEncounterSettings: {
      /** Show Health */
      show_health: boolean;
      /** Show Icons */
      show_icons: boolean;
    };
    /** DiscordTextChannel */
    DiscordTextChannel: {
      /** Id */
      id: number;
      /** Name */
      name: string;
      /** Members */
      members: string[];
      /** Guild */
      guild: string;
    };
    /** EncounterCreature */
    EncounterCreature: {
      /** Id */
      id: number;
      /** Creature Id */
      creature_id: number;
      /** Encounter Id */
      encounter_id: number;
      /** Hp */
      hp: number;
      /** Initiative */
      initiative: number;
      /** Is Active */
      is_active: boolean;
      /** Name */
      name: string;
      /** Max Hp */
      max_hp: number;
    };
    /** EncounterParticipant */
    EncounterParticipant: {
      /** Id */
      id: number;
      /** Creature Id */
      creature_id: number;
      /** Encounter Id */
      encounter_id: number;
      /** Hp */
      hp: number;
      /** Initiative */
      initiative: number;
      /** Is Active */
      is_active: boolean;
    };
    /** EncounterRequest */
    EncounterRequest: {
      /** Name */
      name: string;
      /** Description */
      description: string;
    };
    /** EncounterResponse */
    EncounterResponse: {
      /** Id */
      id: number;
      /** Name */
      name?: string | null;
      /** Description */
      description?: string | null;
      /** Started At */
      started_at?: string | null;
      /** Ended At */
      ended_at?: string | null;
    };
    /** HTTPValidationError */
    HTTPValidationError: {
      /** Detail */
      detail?: components["schemas"]["ValidationError"][];
    };
    /** ValidationError */
    ValidationError: {
      /** Location */
      loc: (string | number)[];
      /** Message */
      msg: string;
      /** Error Type */
      type: string;
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}

export type $defs = Record<string, never>;

export type external = Record<string, never>;

export interface operations {

  /** Read Root */
  read_root__get: {
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": unknown;
        };
      };
    };
  };
  /** Get User Encounters */
  get_user_encounters_api_encounters_get: {
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["EncounterResponse"][];
        };
      };
    };
  };
  /** Create Encounter */
  create_encounter_api_encounters_post: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["EncounterRequest"];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["EncounterResponse"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Get User Encounter By Id */
  get_user_encounter_by_id_api_encounters__encounter_id__get: {
    parameters: {
      path: {
        encounter_id: number;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["EncounterResponse"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Update Encounter */
  update_encounter_api_encounters__encounter_id__put: {
    parameters: {
      path: {
        encounter_id: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["EncounterRequest"];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["EncounterResponse"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Delete Encounter */
  delete_encounter_api_encounters__encounter_id__delete: {
    parameters: {
      path: {
        encounter_id: number;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["EncounterResponse"][];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Update Turn */
  update_turn_api_encounters__encounter_id__turn_post: {
    parameters: {
      query: {
        to: "next" | "previous";
      };
      path: {
        encounter_id: number;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["EncounterCreature"][];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Update Encounter Creature */
  update_encounter_creature_api_encounters__encounter_id__creatures__creature_id__put: {
    parameters: {
      path: {
        encounter_id: number;
        creature_id: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["EncounterParticipant"];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["EncounterCreature"][];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Add Existing Creature To Encounter */
  add_existing_creature_to_encounter_api_encounters__encounter_id__creatures__creature_id__post: {
    parameters: {
      path: {
        encounter_id: number;
        creature_id: number;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["EncounterCreature"][];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Remove Creature From Encounter */
  remove_creature_from_encounter_api_encounters__encounter_id__creatures__creature_id__delete: {
    parameters: {
      path: {
        encounter_id: number;
        creature_id: number;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["EncounterCreature"][];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Start Encounter */
  start_encounter_api_encounters__encounter_id__start_post: {
    parameters: {
      path: {
        encounter_id: number;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["EncounterResponse"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Stop Encounter */
  stop_encounter_api_encounters__encounter_id__stop_post: {
    parameters: {
      path: {
        encounter_id: number;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": unknown;
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Get Encounter Creatures */
  get_encounter_creatures_api_encounters__encounter_id__creatures_get: {
    parameters: {
      path: {
        encounter_id: number;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["EncounterCreature"][];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Add Creature To Encounter */
  add_creature_to_encounter_api_encounters__encounter_id__creatures_post: {
    parameters: {
      path: {
        encounter_id: number;
      };
    };
    requestBody: {
      content: {
        "application/x-www-form-urlencoded": components["schemas"]["Body_add_creature_to_encounter_api_encounters__encounter_id__creatures_post"];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["EncounterCreature"][];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Get User Creature */
  get_user_creature_api_creatures__creature_id__get: {
    parameters: {
      path: {
        creature_id: number;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["CreatureResponse"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Update Creature */
  update_creature_api_creatures__creature_id__put: {
    parameters: {
      path: {
        creature_id: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["CreatureRequest"];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["CreatureResponse"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Delete Creature */
  delete_creature_api_creatures__creature_id__delete: {
    parameters: {
      path: {
        creature_id: number;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["CreatureResponse"][];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Get User Creatures */
  get_user_creatures_api_creatures_get: {
    parameters: {
      query?: {
        name?: string | null;
        filter_encounter?: number | null;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["CreatureResponse"][];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Create Creature */
  create_creature_api_creatures_post: {
    requestBody: {
      content: {
        "application/x-www-form-urlencoded": components["schemas"]["Body_create_creature_api_creatures_post"];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["CreatureResponse"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Get Discord Channel */
  get_discord_channel_api_discord_channel_get: {
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["DiscordTextChannel"];
        };
      };
    };
  };
  /** Get Discord Settings */
  get_discord_settings_api_discord_settings_get: {
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["DiscordEncounterSettings"];
        };
      };
    };
  };
  /** Update Discord Settings */
  update_discord_settings_api_discord_settings_put: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["DiscordEncounterSettings"];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": unknown;
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
}
