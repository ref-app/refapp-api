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
          onChange={setValue}
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
          onChange={(newText) => setValue(newText)}
        />
      );
  }
  return assertIsNever(field);
};

type AtsConfigPreviewProps = Readonly<{
  configFields: ReadonlyArray<AtsConfigField>;
  locale: CoreUILocale;
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
