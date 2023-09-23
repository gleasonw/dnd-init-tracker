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
    /** List Encounters */
    get: operations["list_encounters_api_encounters_get"];
    /** Create Encounter */
    post: operations["create_encounter_api_encounters_post"];
  };
  "/api/encounters/{encounter_id}": {
    /** Get Encounter */
    get: operations["get_encounter_api_encounters__encounter_id__get"];
    /** Update Encounter */
    put: operations["update_encounter_api_encounters__encounter_id__put"];
    /** Delete Encounter */
    delete: operations["delete_encounter_api_encounters__encounter_id__delete"];
  };
  "/api/encounters/{encounter_id}/next_turn": {
    /** Next Turn */
    post: operations["next_turn_api_encounters__encounter_id__next_turn_post"];
  };
  "/api/encounters/{encounter_id}/previous_turn": {
    /** Previous Turn */
    post: operations["previous_turn_api_encounters__encounter_id__previous_turn_post"];
  };
  "/api/encounters/{encounter_id}/creatures/{creature_id}": {
    /** Update Encounter Creature */
    put: operations["update_encounter_creature_api_encounters__encounter_id__creatures__creature_id__put"];
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
    /** List Creatures */
    get: operations["list_creatures_api_encounters__encounter_id__creatures_get"];
    /** Add Creature */
    post: operations["add_creature_api_encounters__encounter_id__creatures_post"];
  };
  "/api/creatures/{creature_id}": {
    /** Update Creature */
    put: operations["update_creature_api_creatures__creature_id__put"];
    /** Delete Creature */
    delete: operations["delete_creature_api_creatures__creature_id__delete"];
  };
}

export type webhooks = Record<string, never>;

export interface components {
  schemas: {
    /** CreatureRequest */
    CreatureRequest: {
      /** Name */
      name: string;
      /** Icon */
      icon: string;
      /** Stat Block */
      stat_block: string;
      /** Max Hp */
      max_hp: number;
    };
    /** CreatureResponse */
    CreatureResponse: {
      /** Name */
      name: string;
      /** Icon */
      icon: string;
      /** Stat Block */
      stat_block: string;
      /** Max Hp */
      max_hp: number;
      /** Id */
      id: number;
    };
    /** EncounterCreature */
    EncounterCreature: {
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
      /** Icon */
      icon: string;
      /** Stat Block */
      stat_block: string;
      /** Max Hp */
      max_hp: number;
      /** Id */
      id: number;
    };
    /** EncounterParticipant */
    EncounterParticipant: {
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
      name: string | null;
      /** Description */
      description: string | null;
      /** Started At */
      started_at: string | null;
      /** Ended At */
      ended_at: string | null;
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
  /** List Encounters */
  list_encounters_api_encounters_get: {
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
  /** Get Encounter */
  get_encounter_api_encounters__encounter_id__get: {
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
  /** Next Turn */
  next_turn_api_encounters__encounter_id__next_turn_post: {
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
  /** Previous Turn */
  previous_turn_api_encounters__encounter_id__previous_turn_post: {
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
          "application/json": components["schemas"]["EncounterParticipant"];
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
  /** List Creatures */
  list_creatures_api_encounters__encounter_id__creatures_get: {
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
  /** Add Creature */
  add_creature_api_encounters__encounter_id__creatures_post: {
    parameters: {
      path: {
        encounter_id: number;
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
      query: {
        encounter_id: number;
      };
      path: {
        creature_id: number;
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
