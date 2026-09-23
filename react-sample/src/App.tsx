import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Theme,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Container,
  createTheme,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  MenuItem,
  Select,
  TextField,
  ThemeProvider,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import * as React from "react";
import { AtsConfigPreview } from "./AtsConfigPreview";
import { AtsWebhookData, RefappAtsConfig } from "./lib/ats-types";
import "./style.css";
import { z } from "zod";
import { map, random } from "lodash";

/**
 * From the config-examples directory in this repository
 */
const configFiles = [
  "Cost Centers, existing project, English.json",
  "Cost Centers, existing project, Swedish.json",
  "Cost Centers.json",
  "External Recruitment, pre-filled values from default project template.json",
  "Project Templates, existing project, English.json",
  "Project Templates, existing project, Swedish.json",
  "Project Templates.json",
] as const;
type ConfigFile = (typeof configFiles)[number];
const toConfigFile = (value: unknown) =>
  z
    .enum(["", ...configFiles])
    .catch("")
    .parse(value);

const createOurTheme = (): Theme => {
  return createTheme({
    typography: {
      fontFamily: "Ubuntu, sans-serif",
      h1: { fontSize: 22 },
      // Originally style of h5, repurposed here for h2 (Refapp config "header")
      h2: { fontSize: "1.5rem", lineHeight: 1.334, fontWeight: 400 },
      // Match size of body1, but make bold (Refapp config "subheader")
      h3: { fontSize: "1rem", lineHeight: 1.5, fontWeight: 600 },
    },
    palette: {
      primary: {
        main: "#fd954b",
      },
      background: {
        default: "#b16834",
      },
    },
  });
};

const configMethods = ["sample", "live"] as const;
const defaultConfigMethod = configMethods[0];
type ConfigMethod = (typeof configMethods)[number];
const toConfigMethod = (value: unknown) =>
  z.enum(configMethods).catch(defaultConfigMethod).parse(value);

/**
 * "account" is Refapp's Account Integration, where the bearer token alone
 * identifies the account. "partner" is an ATS partner integration, where each
 * customer is identified by a separate provider key.
 */
const liveModes = ["account", "partner"] as const;
const defaultLiveMode = liveModes[0];
type LiveMode = (typeof liveModes)[number];
const toLiveMode = (value: unknown) =>
  z.enum(liveModes).catch(defaultLiveMode).parse(value);

type LiveEndpoints = { config: string; post: string };
const defaultLiveEndpoints: Record<LiveMode, LiveEndpoints> = {
  account: {
    config: "https://app.refapp.com/webhooks/account-integration/config",
    post: "https://app.refapp.com/webhooks/account-integration",
  },
  partner: { config: "", post: "" },
};

const safeUrl = (url: string) => {
  try {
    return new URL(url);
  } catch (_) {
    return undefined;
  }
};

const createConfigError = (message: string): RefappAtsConfig => ({
  config: {
    fields: [
      {
        id: "error",
        type: "text",
        label: message ?? "An error occurred",
      },
    ],
  },
});

const fetchFromGitHub = async (
  atsConfigFile: ConfigFile
): Promise<RefappAtsConfig> => {
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/ref-app/refapp-api/main/config-examples/${encodeURIComponent(
        atsConfigFile
      )}`
    );
    const config = await response.json();
    return config;
  } catch (e) {
    return createConfigError(e instanceof Error ? e.message : String(e));
  }
};

const fetchFromRefapp = async (
  configEndpoint: string,
  atsSecret: string,
  customerSecret: string | undefined,
  webhookData: AtsWebhookData | undefined
): Promise<RefappAtsConfig> => {
  try {
    const url = new URL(configEndpoint);
    if (webhookData !== undefined) {
      url.searchParams.set("webhook_data", JSON.stringify(webhookData));
    }
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${atsSecret}`,
        ...(customerSecret !== undefined && {
          "X-Provider-Key": customerSecret,
        }),
      },
    });
    const config = await response.json();
    if (!response.ok) {
      return createConfigError(config.message);
    }
    return config;
  } catch (e) {
    return createConfigError(e instanceof Error ? e.message : String(e));
  }
};

const generateCandidate = (recruiterDomain: string) => {
  const candidateId = Math.random().toString(36).slice(2);
  const jobId = Math.random().toString(36).slice(2);
  return {
    "id": candidateId,
    "first-name": "John",
    "last-name": "Doe",
    "email": `john.doe.${candidateId}@private.example`,
    "phone": `+467017406${random(0, 94) + 5}`,
    "language": "en",
    "job": {
      id: jobId,
      title: `Job #${jobId}`,
    },
    "recruiter": {
      "first-name": "Richard",
      "last-name": "Roe",
      "email": `richard.roe@${recruiterDomain}`,
    },
  };
};

/**
 * The POST that Submit sends, built up front so it can be shown before it is
 * sent. The candidate is generated once here, so what is shown is what is sent.
 */
type LiveRequest = Readonly<{
  url: string;
  headers: Readonly<Record<string, string>>;
  body: unknown;
}>;

const buildLiveRequest = (
  postEndpoint: string,
  atsSecret: string,
  customerSecret: string | undefined,
  customerDomain: string,
  dataObject: AtsWebhookData
): LiveRequest => ({
  url: postEndpoint,
  headers: {
    "Authorization": `Bearer ${atsSecret}`,
    "Content-Type": "application/json",
  },
  body: {
    "partner-event": {
      ...(customerSecret !== undefined && {
        company: { uuid: customerSecret },
      }),
      "candidate": generateCandidate(customerDomain),
      "partner-result": {},
      "webhook-data": dataObject,
    },
  },
});

const sendLiveRequest = async (request: LiveRequest): Promise<string> => {
  try {
    const response = await fetch(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(request.body),
    });
    const json = await response.json();
    return JSON.stringify(json, undefined, 2);
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
};

/** Keeps a secret recognisable on screen without showing all of it */
const maskSecret = (secret: string) =>
  secret.length > 8 ? `${secret.slice(0, 4)}…${secret.slice(-4)}` : "…";

const codeBlockSx = {
  whiteSpace: "pre",
  overflowX: "auto",
  p: 1,
  bgcolor: "grey.50",
  borderColor: "grey.300",
  borderWidth: 1,
  borderStyle: "solid",
  fontFamily: "monospace",
  fontSize: 13,
} as const;

const LiveRequestDialog = ({
  request,
  onCancel,
  onSend,
}: Readonly<{
  request: LiveRequest | undefined;
  onCancel: () => void;
  onSend: (request: LiveRequest) => void;
}>) => (
  <Dialog
    open={request !== undefined}
    onClose={onCancel}
    maxWidth="md"
    fullWidth
  >
    <DialogTitle>Send this request to Refapp?</DialogTitle>
    {request && (
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <DialogContentText>
          This starts a real reference check for the candidate below. The
          Authorization token is shortened here but sent in full.
        </DialogContentText>
        <Box sx={{ ...codeBlockSx, flexShrink: 0 }}>
          {[
            `POST ${request.url}`,
            ...Object.entries(request.headers).map(([name, value]) =>
              name === "Authorization"
                ? `${name}: Bearer ${maskSecret(value.replace(/^Bearer /, ""))}`
                : `${name}: ${value}`
            ),
          ].join("\n")}
        </Box>
        <Box sx={codeBlockSx}>{JSON.stringify(request.body, undefined, 2)}</Box>
      </DialogContent>
    )}
    <DialogActions>
      <Button onClick={onCancel}>Cancel</Button>
      <Button variant="contained" onClick={() => request && onSend(request)}>
        Send
      </Button>
    </DialogActions>
  </Dialog>
);

export default function App() {
  const [configMethod, setConfigMethod] =
    React.useState<ConfigMethod>(defaultConfigMethod);
  const [atsConfigFile, setAtsConfigFile] = React.useState<ConfigFile | "">("");
  const [atsConfig, setAtsConfig] = React.useState<RefappAtsConfig>();
  const [liveMode, setLiveMode] = React.useState<LiveMode>(defaultLiveMode);
  const [liveEndpoints, setLiveEndpoints] =
    React.useState<Record<LiveMode, LiveEndpoints>>(defaultLiveEndpoints);
  const { config: liveConfigEndpoint, post: livePostEndpoint } =
    liveEndpoints[liveMode];
  const setLiveEndpoint = (endpoint: keyof LiveEndpoints, value: string) =>
    setLiveEndpoints((endpoints) => ({
      ...endpoints,
      [liveMode]: { ...endpoints[liveMode], [endpoint]: value },
    }));
  const [liveAtsSecret, setLiveAtsSecret] = React.useState<string>("");
  const [liveCustomerSecret, setLiveCustomerSecret] =
    React.useState<string>("");
  const [liveCustomerDomain, setLiveCustomerDomain] =
    React.useState<string>("");
  const [submitResults, setSubmitResults] = React.useState<string>("");
  const [pendingRequest, setPendingRequest] = React.useState<LiveRequest>();
  const [resetTrigger, setResetTrigger] = React.useState<number>(0);
  // Current field values, set when a field marked `refetch` changes
  const [liveWebhookData, setLiveWebhookData] =
    React.useState<AtsWebhookData>();
  const theme = React.useMemo(() => createOurTheme(), []);
  // Account Integration has no provider key: the token identifies the account
  const liveProviderKey =
    liveMode === "partner" ? liveCustomerSecret : undefined;

  React.useEffect(() => {
    // Refetching can have several requests in flight; keep only the latest
    let ignore = false;
    const setLatestAtsConfig = (atsConfig: RefappAtsConfig | undefined) => {
      if (!ignore) {
        setAtsConfig(atsConfig);
      }
    };
    const configEndpointUrl = safeUrl(liveConfigEndpoint);
    const postEndpointUrl = safeUrl(livePostEndpoint);
    if (configMethod === "sample" && atsConfigFile !== "") {
      fetchFromGitHub(atsConfigFile).then(setLatestAtsConfig);
    } else if (
      configMethod === "live" &&
      configEndpointUrl !== undefined &&
      configEndpointUrl.pathname.length > 0 &&
      postEndpointUrl !== undefined &&
      postEndpointUrl.pathname.length > 0 &&
      liveAtsSecret.length > 0 &&
      (liveProviderKey === undefined || liveProviderKey.length > 0)
    ) {
      fetchFromRefapp(
        liveConfigEndpoint,
        liveAtsSecret,
        liveProviderKey,
        liveWebhookData
      ).then(setLatestAtsConfig);
    } else {
      setAtsConfig(undefined);
    }
    return () => {
      ignore = true;
    };
  }, [
    configMethod,
    atsConfigFile,
    liveConfigEndpoint,
    liveAtsSecret,
    liveProviderKey,
    liveWebhookData,
    resetTrigger,
  ]);

  const handleChange = (event: React.SyntheticEvent) => {
    const accordion = event.currentTarget.closest("[id^='config-']");
    if (accordion) {
      setConfigMethod(toConfigMethod(accordion.id.substring(7)));
    }
  };

  const handleSubmit = (values: AtsWebhookData) => {
    setPendingRequest(
      buildLiveRequest(
        livePostEndpoint,
        liveAtsSecret,
        liveProviderKey,
        liveCustomerDomain,
        values
      )
    );
  };

  const handleSend = (request: LiveRequest) => {
    setPendingRequest(undefined);
    sendLiveRequest(request).then((result) => setSubmitResults(result));
  };

  const onReset = () => {
    console.log("onReset");
    setSubmitResults("");
    setLiveWebhookData(undefined);
    setResetTrigger((count) => count + 1);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container sx={{ display: "flex", flexDirection: "column", my: 2 }}>
        {/* All Accordions must share a common parent for the final rounded corners to work. */}
        <Box>
          <Accordion
            id="config-sample"
            expanded={configMethod === "sample"}
            onChange={handleChange}
            disableGutters
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h1">
                Refapp configuration UI sample
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Select
                value={atsConfigFile}
                onChange={(e) => setAtsConfigFile(toConfigFile(e.target.value))}
                sx={{
                  width: 1,
                }}
              >
                {configFiles.map((f) => (
                  <MenuItem key={f} value={f}>
                    {f}
                  </MenuItem>
                ))}
              </Select>
            </AccordionDetails>
          </Accordion>
          <Accordion
            id="config-live"
            expanded={configMethod === "live"}
            onChange={handleChange}
            disableGutters
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h1">Live Refapp test</Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <ToggleButtonGroup
                exclusive
                fullWidth
                color="primary"
                value={liveMode}
                onChange={(_, value) => {
                  if (value !== null) {
                    setLiveMode(toLiveMode(value));
                  }
                }}
              >
                <ToggleButton value="account">Account integration</ToggleButton>
                <ToggleButton value="partner">ATS partner</ToggleButton>
              </ToggleButtonGroup>
              <TextField
                key={`${liveMode}-config`}
                label={"Configuration Endpoint"}
                value={liveConfigEndpoint}
                onChange={(e) =>
                  setLiveEndpoint("config", e.currentTarget.value)
                }
              />
              <TextField
                key={`${liveMode}-post`}
                label={"POST Endpoint"}
                value={livePostEndpoint}
                onChange={(e) => setLiveEndpoint("post", e.currentTarget.value)}
              />
              <TextField
                label={liveMode === "account" ? "Account token" : "ATS secret"}
                value={liveAtsSecret}
                onChange={(e) => setLiveAtsSecret(e.currentTarget.value)}
              />
              {liveMode === "partner" && (
                <TextField
                  label={"Customer secret"}
                  value={liveCustomerSecret}
                  onChange={(e) => setLiveCustomerSecret(e.currentTarget.value)}
                />
              )}
              <TextField
                label={"Customer email domain"}
                value={liveCustomerDomain}
                onChange={(e) => setLiveCustomerDomain(e.currentTarget.value)}
              />
            </AccordionDetails>
          </Accordion>
        </Box>

        {atsConfig && (
          <Card sx={{ mt: 2 }}>
            <CardContent>
              {configMethod === "live" ? (
                <AtsConfigPreview
                  configFields={atsConfig.config.fields}
                  onReset={onReset}
                  onSubmit={handleSubmit}
                  onRefetch={setLiveWebhookData}
                />
              ) : (
                <AtsConfigPreview
                  configFields={atsConfig.config.fields}
                  onReset={onReset}
                />
              )}
            </CardContent>
          </Card>
        )}

        {submitResults && (
          <Card sx={{ mt: 2 }}>
            <Box sx={{ ...codeBlockSx, m: 2 }}>{submitResults}</Box>
          </Card>
        )}
        <LiveRequestDialog
          request={pendingRequest}
          onCancel={() => setPendingRequest(undefined)}
          onSend={handleSend}
        />
      </Container>
    </ThemeProvider>
  );
}
