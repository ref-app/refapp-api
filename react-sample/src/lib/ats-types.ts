export type InfoClass = "info" | "warning" | "error" | "success" | "default";

export type AtsConfigFieldValue = string | boolean;

/**
 * Strict subset of html input types
 */
export type HtmlConfigFieldType = "select" | "checkbox" | "text" | "hidden";

export type RefappLabelFieldTypes = "header" | "subheader" | "paragraph";

export type HtmlConfigOption = Readonly<{
  id: string;
  label: string;
}>;

export type HtmlConfigField<T extends string> = Readonly<{
  id: string;
  type: T;
  value?: AtsConfigFieldValue;
  label: string;
  /**
   * For "text" (textbox) fields
   */
  placeholder?: string;
  /**
   * For select fields
   */
  options?: ReadonlyArray<HtmlConfigOption>;
  disabled?: boolean;
}>;

/**
 * With additional field types to express labels but removing the "hidden" type
 * These will map to "infobox" for Teamtailor
 */
export type RefappConfigFieldType = AtsConfigField["type"];

export type AtsConfigField =
  | HtmlConfigField<Exclude<HtmlConfigFieldType, "hidden" | "url" | "radio">>
  | (HtmlConfigField<RefappLabelFieldTypes> &
      Readonly<{
        /**
         * Richer format version of text in "label" for label fields (header, subheader and paragraph)
         */
        "label-markdown"?: string;
        /**
         * Same as label-markdown but rendered to html
         */
        "label-html"?: string;
        /**
         * For label fields (header, subheader and paragraph)
         */
        "label-class"?: InfoClass;
      }>);

export type AtsConfigResult<T extends HtmlConfigField<string>> = {
  readonly config: {
    readonly fields: ReadonlyArray<T>;
  };
};

export type RefappAtsConfig = AtsConfigResult<AtsConfigField>;

export interface AtsCompany {
  "name": string;
  /**
   * For Teamtailor, the internal teamtailor id
   * For other systems, the "provider key" used to connect companies in the two systems
   */
  "uuid": string;
  /**
   * Refapp Addition
   * Link to the entity in the ATS to send the
   * user back from the external system
   */
  "ats-url"?: string;
}

export interface AtsRecruiter {
  "name": string | undefined;
  /**
   * Refapp Addition
   * If first and last name are provided the are used instead of name
   * when onboarding a new user
   */
  "first-name"?: string;
  /**
   * Refapp Addition
   * If first and last name are provided the are used instead of name
   * when onboarding a new user
   */
  "last-name"?: string;
  "email": string;
  "phone"?: string;
  /**
   * Refapp Addition
   * Link to the entity in the ATS to send the
   * user back from the external system
   */
  "ats-url"?: string;
}

export interface AtsJob {
  /**
   * Unique candidate id.
   * Expanded from Teamtailor number to number or string
   */
  "id": number | string;
  "title": string;
  /**
   * Refapp Addition
   * If true, the job title is hidden from candidates and referees
   */
  "private-title"?: boolean;
  /**
   * Refapp Addition
   * If provided, the position is an external recruitment for a client
   */
  "client-name"?: string;
  /**
   * Refapp Addition
   * These recruiters will be added as members to the project
   * and be invited/onboarded as needed.
   * If not provided, the candidate recruiter will be the only project
   * member upon creation
   */
  "recruiting-team"?: AtsRecruiter[];
  /**
   * Refapp Addition
   * Link to the entity in the ATS to send the
   * user back from the external system
   */
  "ats-url"?: string;
  /**
   * Refapp Addition
   * Store a public RSA key to encrypt PII inside update calls.
   * Expected to be a Base64url encoded PKCS#1 DER key.
   */
  "ats-public-key"?: string;
  /**
   * Refapp Addition
   * Store a string name identifying the ATS. This is used in addition to the
   * name already associated with the ATS in Refapp. E.g. to specify the
   * variation/version of an ATS being used.
   */
  "ats-name"?: string;
}

export interface AtsReferee {
  "first-name": string;
  "last-name": string;
  "email"?: string;
  "phone"?: string;
  /**
   * The language used to communicate with the candidate
   * Two letter ISO 639-1 (preferred) with fallback to three letter ISO 639-2
   * A full locale (language-region) code à la Java or .NET is also allowed, e.g. en-GB
   */
  "language"?: string;
}

export interface AtsCandidate {
  /**
   * Unique candidate id.
   * Expanded from Teamtailor number to number or string
   */
  "id": number | string;
  "first-name": string;
  "last-name": string;
  "email": string;
  "phone"?: string;
  /**
   * Refapp Addition.
   * List of referees to add for the candidate
   */
  "referees"?: AtsReferee[];
  "recruiter": AtsRecruiter;
  "job": AtsJob;
  /**
   * Refapp Addition
   * The language used to communicate with the candidate
   * Two letter ISO 639-1 (preferred) with fallback to three letter ISO 639-2
   * A full locale (language-region) code à la Java or .NET is also allowed, e.g. en-GB
   */
  "language"?: string;
  /**
   * Refapp Addition
   * Link to the entity in the ATS to send the
   * user back from the external system
   */
  "ats-url"?: string;
}

export type AtsResultStatus =
  | "sending"
  | "sent"
  | "pending"
  | "completed"
  | "failed";

export type AtsWebhookData = Record<string, string | boolean>;

export interface AtsPartnerEvent {
  "company": AtsCompany;
  "candidate": AtsCandidate;
  "partner-result": {
    "id": string;
    "status": AtsResultStatus;
    /**
     * New 2022-07-05
     * If set to a url with a host name that is configured with a bearer token for the Refapp instance,
     * this url will receive PUT calls with an update payload whenever the candidate changes its state
     */
    "update-url"?: string;
  };
  /**
   * Additional configuration creates from settings edited by the user through a UI created from the /config metadata
   */
  "webhook-data"?: AtsWebhookData;
}

export interface AtsPartnerEventPayload {
  "partner-event": AtsPartnerEvent;
}

export interface CandidateAttachment {
  url: string;
  description: string;
}

export interface CandidateAssessment {
  /**
   * Refapp Addition to specify the kind of assessment
   */
  type?: "reference-check";
  /**
   * Left for compatibility with Teamtailor test report assessments.
   * Set to 100*count/total
   */
  score?: number;
  /**
   * Refapp Addition
   * For reference checking, the number of referees added
   */
  total?: number;
  /**
   * Refapp Addition
   * For reference checking, the number of referees that have submitted their answers
   */
  completed?: number;
}

export interface CandidateResults {
  type: "partner-results";
  id: string;
  attributes: {
    /**
     * Refapp Addition
     */
    status: AtsResultStatus;
    summary: string;
    /**
     * Link to the report
     */
    url?: string;
    /**
     * Refapp Addition
     * Link to candidate in Refapp (e.g. https://app.refapp.se/candidate/abcd1234)
     */
    candidateLink?: CandidateAttachment;
    /**
     * Holds the reference checking result
     */
    assessment?: CandidateAssessment;
    /**
     * General field for any kind of attachment.
     * Can be ignored by the receiving end if the candidateLink and url fields are handled.
     */
    attachments?: CandidateAttachment[];
  };
}
