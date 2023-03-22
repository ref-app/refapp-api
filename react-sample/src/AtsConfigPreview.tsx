import { Checkbox, FormControlLabel, MenuItem, Select, TextField, Typography, TypographyProps } from "@mui/material";
import * as React from "react";
import * as _ from "lodash";
import { AtsConfigField, AtsConfigFieldValue, HtmlConfigFieldType, RefappConfigFieldType } from "./lib/ats-types";
import { assertIsNever } from "./lib/typehelpers";

const textVariantFromFieldType = (
  fieldType: Exclude<RefappConfigFieldType, HtmlConfigFieldType>
): TypographyProps["variant"] => {
  switch (fieldType) {
    case "header":
      return "h4";
    case "subheader":
      return "h5";
    case "paragraph":
      return "body1";
  }
  return assertIsNever(fieldType);
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
        <Typography variant={textVariantFromFieldType(field.type)}>
          {field.label}
        </Typography>
      );
    case "select":
      return field.options ? (
        <Select
          label={field.label}
          value={_.isString(value) ? value : ""}
          disabled={field.disabled}
          onChange={e=>setValue(e.target.value)}
        >
          {field.options.map((option) => (
            // No support for optgroups
            <MenuItem key={option.id} value={option.id}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
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
  locale: string;
}>;
export const AtsConfigPreview = ({ configFields }: AtsConfigPreviewProps) => {
  return (
    <div className="ats-config-preview-content">
      {configFields.map((field) => (
        <AtsConfigFieldPreview key={field.id} field={field} />
      ))}
    </div>
  );
};
