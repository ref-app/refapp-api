import {
  Alert,
  AlertProps,
  Box,
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
      return "h3";
    case "subheader":
      return "h4";
    case "paragraph":
      return "body1";
  }
  return assertIsNever(fieldType);
};

const TextContainer = ({
  labelClass,
  children,
}: React.PropsWithChildren<{
  labelClass: InfoClass;
}>) => {
  const severity = toSeverity(labelClass);
  if (severity) {
    return <Alert severity={severity}>{children}</Alert>;
  }
  return <React.Fragment>{children}</React.Fragment>;
};

type AtsConfigFieldPreviewProps = Readonly<{
  field: AtsConfigField;
}>;
export const AtsConfigFieldPreview = ({
  field,
}: AtsConfigFieldPreviewProps) => {
  const [value, setValue] = React.useState<AtsConfigFieldValue | undefined>(
    field.value
  );

  switch (field.type) {
    case "checkbox":
      return (
        <FormControlLabel
          label={field.label}
          control={
            <Checkbox
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
        <Box p={2}>
          <TextContainer labelClass={field["label-class"]}>
            {field["label-markdown"] ? (
              <Typography component="div">
                <MuiMarkdown>{field["label-markdown"]}</MuiMarkdown>
              </Typography>
            ) : (
              <Typography variant={textVariantFromFieldType(field.type)}>
                {field.label}
              </Typography>
            )}
          </TextContainer>
        </Box>
      );
    case "select":
      return field.options ? (
        <FormControl sx={{ m: 1, minWidth: 120 }}>
          <InputLabel id={field.id}>{field.label}</InputLabel>
          <Select
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

type AtsConfigPreviewProps = Readonly<{
  configFields: ReadonlyArray<AtsConfigField>;
}>;
export const AtsConfigPreview = ({ configFields }: AtsConfigPreviewProps) => {
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {configFields.map((field) => (
        <AtsConfigFieldPreview key={field.id} field={field} />
      ))}
    </Box>
  );
};
