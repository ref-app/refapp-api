import { z, type ZodTypeAny } from "zod";
// Do not import helpers here - this file needs to be standalone (apart from zod)

/**
 * Zod helper: we only want undefined values for optional, but some integrations
 * have been forced to use null values because of their JSON serialisation
 * libraries. For now we will accept both null and undefined, but for our
 * application purposes we have Zod convert all null values to undefined.
 */
const optionalWithNull = <T extends ZodTypeAny>(t: T) =>
  t.nullish().transform((v) => (v === null ? undefined : v));

export type InfoClass = "info" | "warning" | "error" | "success" | "default";

export type AtsConfigFieldValue = string | boolean | number;

/**
 * Strict subset of html input types
 */
export type HtmlConfigFieldType = "select" | "checkbox" | "text" | "hidden";

export const refappLabelFieldTypes = [
  "header",
  "subheader",
  "paragraph",
] as const;

export type RefappLabelFieldTypes = (typeof refappLabelFieldTypes)[number];

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
  refetch?: boolean;
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

const atsCompanySchema = z.object({
  /**
   * Name of the company.
   */
  "name": optionalWithNull(z.string()),
  /**
   * For Teamtailor, the internal teamtailor id
   * For other systems, the "provider key" used to connect companies in the two systems
   */
  "uuid": z.string(),
  /**
   * Refapp Addition
   * Link to the entity in the ATS to send the
   * user back from the external system
   */
  "ats-url": optionalWithNull(z.string()),
});

export type AtsCompany = z.infer<typeof atsCompanySchema>;

export const atsRecruiterSchema = z.object({
  /**
   * Name of the recruiter.
   */
  "name": optionalWithNull(z.string()),
  /**
   * Refapp Addition
   * If first and last name are provided the are used instead of name
   * when onboarding a new user
   */
  "first-name": optionalWithNull(z.string()),
  /**
   * Refapp Addition
   * If first and last name are provided the are used instead of name
   * when onboarding a new user
   */
  "last-name": optionalWithNull(z.string()),
  /**
   * Email of the recruiter.
   */
  "email": z.string(),
  /**
   * Phone number of the recruiter.
   */
  "phone": optionalWithNull(z.string()),
  /**
   * Refapp Addition
   * Optional field that will be merged with `phone` to become the final unique
   * telephone number. For systems where the country calling code is stored
   * separate from the rest of the number.
   * Example value: "+46".
   */
  "country-calling-code": optionalWithNull(z.string()),
  /**
   * Refapp Addition
   * Link to the entity in the ATS to send the
   * user back from the external system
   */
  "ats-url": optionalWithNull(z.string()),
});

export type AtsRecruiter = z.infer<typeof atsRecruiterSchema>;

const atsJobSchema = z.object({
  /**
   * Unique job id.
   * Expanded from Teamtailor number to number or string
   */
  "id": z.union([z.number(), z.string()]),
  /**
   * Title of the job.
   */
  "title": z.string(),
  /**
   * Refapp Addition
   * If true, the job title is hidden from candidates and referees
   */
  "private-title": optionalWithNull(z.boolean()),
  /**
   * Refapp Addition
   * If provided, the position is an external recruitment for a client
   */
  "client-name": optionalWithNull(z.string()),
  /**
   * Refapp Addition
   * These recruiters will be added as members to the project
   * and be invited/onboarded as needed.
   * If not provided, the candidate recruiter will be the only project
   * member upon creation
   */
  "recruiting-team": optionalWithNull(z.array(atsRecruiterSchema)),
  /**
   * Refapp Addition
   * Link to the entity in the ATS to send the
   * user back from the external system
   */
  "ats-url": optionalWithNull(z.string()),
  /**
   * Refapp Addition
   * Store a public RSA key to encrypt PII inside update calls.
   * Expected to be a Base64url encoded PKCS#1 DER key.
   */
  "ats-public-key": optionalWithNull(z.string()),
  /**
   * Refapp Addition
   * Store a string name identifying the ATS. This is used in addition to the
   * name already associated with the ATS in Refapp. E.g. to specify the
   * variation/version of an ATS being used.
   */
  "ats-name": optionalWithNull(z.string()),
  /**
   * Refapp Addition
   * Set the description field in Refapp. This is shown as a note inside the
   * Refapp UI without ever being shown to candidates and/or referees. Can be
   * used to make it easier to find a specific project in the list.
   */
  "description": optionalWithNull(z.string()),
});

export type AtsJob = z.infer<typeof atsJobSchema>;

const atsRefereeSchema = z.object({
  /**
   * First name of the referee.
   */
  "first-name": z.string(),
  /**
   * Last name of the referee.
   */
  "last-name": z.string(),
  /**
   * Email of the referee.
   */
  "email": optionalWithNull(z.string()),
  /**
   * Phone number of the referee.
   */
  "phone": optionalWithNull(z.string()),
  /**
   * Refapp Addition
   * Optional field that will be merged with `phone` to become the final unique
   * telephone number. For systems where the country calling code is stored
   * separate from the rest of the number.
   * Example value: "+46".
   */
  "country-calling-code": optionalWithNull(z.string()),
  /**
   * The language used to communicate with the candidate
   * Two letter ISO 639-1 (preferred) with fallback to three letter ISO 639-2
   * A full locale (language-region) code à la Java or .NET is also allowed, e.g. en-GB
   */
  "language": optionalWithNull(z.string()),
});
export type AtsReferee = z.infer<typeof atsRefereeSchema>;

const atsCandidateSchema = z.object({
  /**
   * Unique candidate id.
   * Expanded from Teamtailor number to number or string
   */
  "id": z.union([z.number(), z.string()]),
  /**
   * First name of the candidate.
   */
  "first-name": z.string(),
  /**
   * Last name of the candidate.
   */
  "last-name": z.string(),
  /**
   * Email of the candidate. If not provided, only SMS can be used.
   */
  "email": optionalWithNull(z.string()),
  /**
   * Phone number of the candidate.
   */
  "phone": optionalWithNull(z.string()),
  /**
   * Refapp Addition
   * Optional field that will be merged with `phone` to become the final unique
   * telephone number. For systems where the country calling code is stored
   * separate from the rest of the number.
   * Example value: "+46".
   */
  "country-calling-code": optionalWithNull(z.string()),
  /**
   * Refapp Addition.
   * List of referees to add for the candidate
   */
  "referees": optionalWithNull(z.array(atsRefereeSchema)),
  /**
   * Recruiter associated with the candidate.
   */
  "recruiter": atsRecruiterSchema,
  /**
   * Job associated with the candidate.
   */
  "job": atsJobSchema,
  /**
   * Refapp Addition
   * The language used to communicate with the candidate
   * Two letter ISO 639-1 (preferred) with fallback to three letter ISO 639-2
   * A full locale (language-region) code à la Java or .NET is also allowed, e.g. en-GB
   */
  "language": optionalWithNull(z.string()),
  /**
   * Refapp Addition
   * Link to the entity in the ATS to send the
   * user back from the external system
   */
  "ats-url": optionalWithNull(z.string()),
});

export type AtsCandidate = z.infer<typeof atsCandidateSchema>;

export const atsResultStatusValues = [
  "sending",
  "sent",
  "pending",
  "completed",
  "failed",
] as const;
export type AtsResultStatus = (typeof atsResultStatusValues)[number];

export const atsWebhookDataValueSchema = z.union([
  z.string(),
  z.boolean(),
  z.number(),
]);

const atsWebhookDataSchema = z.record(atsWebhookDataValueSchema);

/**
 * No value is *really* undefined in transit (cannot be in json) but zod cannot represent a partial record
 * that has strings as keys. Wait for zod4?
 */
export type AtsWebhookData = z.infer<typeof atsWebhookDataSchema>;

const atsPartnerEventSchema = z.object({
  /**
   * Company associated with the event.
   */
  "company": atsCompanySchema,
  /**
   * Candidate associated with the event.
   */
  "candidate": atsCandidateSchema,
  /**
   * Result from the partner.
   */
  "partner-result": z.object({
    /**
     * ID of the result.
     */
    "id": z.string(),
    /**
     * Status of the result.
     */
    "status": z.enum(atsResultStatusValues).optional(),
    /**
     * New 2022-07-05
     * If set to a url with a host name that is configured with a bearer token for the Refapp instance,
     * this url will receive PUT calls with an update payload whenever the candidate changes its state
     */
    "update-url": optionalWithNull(z.string()),
  }),
  /**
   * Additional configuration created from settings that are edited by the user through a UI built for the /config metadata
   */
  "webhook-data": optionalWithNull(atsWebhookDataSchema),
});

export type AtsPartnerEvent = z.infer<typeof atsPartnerEventSchema>;
export type AtsPartnerEventIncoming = z.input<typeof atsPartnerEventSchema>;

export const atsPartnerEventPayloadSchema = z.object({
  /**
   * Partner event data.
   */
  "partner-event": atsPartnerEventSchema,
});

export type AtsPartnerEventPayload = z.infer<
  typeof atsPartnerEventPayloadSchema
>;
export type AtsPartnerEventPayloadIncoming = z.input<
  typeof atsPartnerEventPayloadSchema
>;

export const candidateAttachmentSchema = z.object({
  url: z.string(),
  description: z.string(),
});
export type CandidateAttachment = z.infer<typeof candidateAttachmentSchema>;

export const fraudWarningTypeValues = [
  "same-ip-address",
  "same-email-address",
  "same-phone-number",
] as const;
export type FraudWarningType = (typeof fraudWarningTypeValues)[number];

export const candidateAssessmentSchema = z.object({
  /**
   * Refapp Addition to specify the kind of assessment
   */
  type: z.literal("reference-check").optional(),
  /**
   * Left for compatibility with Teamtailor test report assessments.
   * Set to 100*count/total
   */
  score: z.number().optional(),
  /**
   * Refapp Addition
   * For reference checking, the number of referees expected to answer (added + minimum requested)
   */
  total: z.number().optional(),

  /**
   * Refapp Addition
   * For reference checking, the number of referees remaining to be submitted by the candidate
   */
  remainingToSubmit: z.number().optional(),
  /**
   * Refapp Addition
   * For reference checking, the number of referees that have submitted their answers
   */
  completed: z.number().optional(),
  /**
   * Refapp Addition
   * A list of unique codes that might indicate fraud
   */
  fraudWarnings: z.array(z.enum(fraudWarningTypeValues)).optional(),
});

export type CandidateAssessment = z.infer<typeof candidateAssessmentSchema>;

export const candidateResultsSchema = z.object({
  type: z.literal("partner-results"),
  id: z.string(),
  attributes: z.object({
    /**
     * Refapp Addition
     */
    status: z.enum(atsResultStatusValues),
    summary: z.string(),
    /**
     * Link to the report
     */
    url: z.string().optional(),
    /**
     * Refapp Addition
     * Link to candidate in Refapp (e.g. https://app.refapp.se/candidate/abcd1234)
     */
    candidateLink: candidateAttachmentSchema.optional(),
    /**
     * Refapp Addition
     * Link for the candidate to submit references (e.g. https://app.refapp.se/reference-entry/abcd1234)
     * Not intended for the recruiter to see (they might click it) - only for the candidate
     */
    candidateSubmissionPageLink: candidateAttachmentSchema.optional(),
    /**
     * Holds the reference checking result
     */
    assessment: candidateAssessmentSchema.optional(),
    /**
     * General field for any kind of attachment.
     * Can be ignored by the receiving end if the candidateLink and url fields are handled.
     */
    attachments: z.array(candidateAttachmentSchema).optional(),
  }),
});

export type CandidateResults = z.infer<typeof candidateResultsSchema>;
