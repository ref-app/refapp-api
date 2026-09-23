import {
  Alert,
  AlertProps,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  TypographyProps,
} from "@mui/material";
import * as React from "react";
import * as _ from "lodash";
import {
  AtsConfigField,
  AtsConfigFieldValue,
  AtsWebhookData,
  HtmlConfigFieldType,
  InfoClass,
  RefappConfigFieldType,
} from "./lib/ats-types";
import { assertIsNever } from "./lib/typehelpers";
import MuiMarkdown from "mui-markdown";

const toSeverity = (value: InfoClass | undefined): AlertProps["severity"] => {
  if (!value || value === "default") {
    return undefined;
  }
  return value;
};

const textVariantFromFieldType = (
  fieldType: Exclude<RefappConfigFieldType, HtmlConfigFieldType>
): TypographyProps["variant"] => {
  switch (fieldType) {
    case "header":
      return "h2";
    case "subheader":
      return "h3";
    case "paragraph":
      return "body1";
  }
  return assertIsNever(fieldType);
};

const TextContainer = ({
  labelClass,
  children,
}: React.PropsWithChildren<{
  labelClass: InfoClass | undefined;
}>) => {
  const severity = toSeverity(labelClass);
  if (severity) {
    return <Alert severity={severity}>{children}</Alert>;
  }
  return <React.Fragment>{children}</React.Fragment>;
};

type AtsConfigFieldPreviewProps = Readonly<{
  field: AtsConfigField;
  value: AtsConfigFieldValue | undefined;
  setValue: (value: AtsConfigFieldValue) => void;
}>;
export const AtsConfigFieldPreview = ({
  field,
  value,
  setValue,
}: AtsConfigFieldPreviewProps) => {
  switch (field.type) {
    case "checkbox":
      return (
        <FormControlLabel
          sx={{ mx: 1, minWidth: 120 }}
          label={field.label}
          control={
            <Checkbox
              name={field.id}
              disabled={field.disabled}
              checked={_.isBoolean(value) ? value : false}
              onChange={(e) => setValue(e.target.checked)}
            />
          }
        />
      );
    case "header":
    case "subheader":
    case "paragraph":
      return (
        <TextContainer labelClass={field["label-class"]}>
          {field["label-markdown"] ? (
            <Typography component="div">
              <MuiMarkdown>{field["label-markdown"]}</MuiMarkdown>
            </Typography>
          ) : (
            <Typography
              sx={{ mx: 1 }}
              variant={textVariantFromFieldType(field.type)}
            >
              {field.label}
            </Typography>
          )}
        </TextContainer>
      );
    case "select":
      return field.options ? (
        <FormControl sx={{ m: 1, minWidth: 120 }}>
          <InputLabel id={field.id}>{field.label}</InputLabel>
          <Select
            name={field.id}
            label={field.label}
            value={_.isString(value) ? value : ""}
            disabled={field.disabled}
            onChange={(e) => setValue(e.target.value)}
          >
            {field.options.map((option) => (
              // No support for optgroups
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : null;
    case "text":
      return (
        <TextField
          name={field.id}
          sx={{ m: 1, minWidth: 120 }}
          disabled={field.disabled}
          label={field.label}
          value={_.isString(value) ? value : ""}
          placeholder={field.placeholder}
          onChange={(e) => setValue(e.target.value)}
        />
      );
  }
  return assertIsNever(field);
};

/**
 * The initial value of every field that has one, keyed by field id. This is
 * the shape Refapp expects in webhook_data.
 */
const valuesFromFields = (
  fields: ReadonlyArray<AtsConfigField>
): AtsWebhookData =>
  Object.fromEntries(
    fields.flatMap((field) =>
      field.value === undefined ? [] : [[field.id, field.value]]
    )
  );

type AtsConfigPreviewProps = Readonly<{
  configFields: ReadonlyArray<AtsConfigField>;
  onReset: () => void;
  onSubmit?: (values: AtsWebhookData) => void;
  /**
   * Called with all current values when a field marked `refetch` changes,
   * so the config can be fetched again with them in webhook_data.
   */
  onRefetch?: (values: AtsWebhookData) => void;
}>;
export const AtsConfigPreview = ({
  configFields,
  onReset,
  onSubmit,
  onRefetch,
}: AtsConfigPreviewProps) => {
  const [values, setValues] = React.useState<AtsWebhookData>(() =>
    valuesFromFields(configFields)
  );

  React.useEffect(() => {
    setValues(valuesFromFields(configFields));
  }, [configFields]);

  const setFieldValue = (field: AtsConfigField, value: AtsConfigFieldValue) => {
    const newValues = { ...values, [field.id]: value };
    setValues(newValues);
    if (field.refetch) {
      onRefetch?.(newValues);
    }
  };

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 0 }}
      component={"form"}
    >
      {configFields.map((field) => (
        <AtsConfigFieldPreview
          key={field.id}
          field={field}
          value={values[field.id]}
          setValue={(value) => setFieldValue(field, value)}
        />
      ))}
      <Box sx={{ display: "flex", gap: 2, mx: 1 }}>
        {onSubmit && (
          <Button
            variant="contained"
            sx={{ flexGrow: 1 }}
            onClick={() => onSubmit(values)}
          >
            Send
          </Button>
        )}
        <Button sx={{ flexGrow: 1 }} onClick={() => onReset()}>
          Reset
        </Button>
      </Box>
    </Box>
  );
};
