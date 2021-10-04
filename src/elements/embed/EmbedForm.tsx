import React from "react";
import { FieldWrapper } from "../../editorial-source-components/FieldWrapper";
import { FieldLayoutVertical } from "../../editorial-source-components/VerticalFieldLayout";
import type { FieldValidationErrors } from "../../plugin/elementSpec";
import type { FieldNameToValueMap } from "../../plugin/helpers/fieldView";
import type { FieldNameToField } from "../../plugin/types/Element";
import { CustomCheckboxView } from "../../renderers/react/customFieldViewComponents/CustomCheckboxView";
import { CustomDropdownView } from "../../renderers/react/customFieldViewComponents/CustomDropdownView";
import type { createEmbedFields } from "./EmbedSpec";

type Props = {
  fieldValues: FieldNameToValueMap<ReturnType<typeof createEmbedFields>>;
  errors: FieldValidationErrors;
  fields: FieldNameToField<ReturnType<typeof createEmbedFields>>;
};

export const EmbedElementTestId = "EmbedElement";

export const EmbedElementForm: React.FunctionComponent<Props> = ({
  errors,
  fields,
}) => (
  <FieldLayoutVertical data-cy={EmbedElementTestId}>
    <CustomDropdownView
      field={fields.weighting}
      label="Weighting"
      errors={errors.weighting}
    />
    <FieldWrapper
      field={fields.sourceUrl}
      errors={errors.sourceUrl}
      label="Source URL"
    />
    <FieldWrapper
      field={fields.embedCode}
      errors={errors.embedCode}
      label="Embed code"
    />
    <FieldWrapper
      field={fields.caption}
      errors={errors.caption}
      label="Caption"
    />
    <FieldWrapper
      field={fields.altText}
      errors={errors.altText}
      label="Alt text"
    />
    <CustomCheckboxView
      field={fields.required}
      errors={errors.required}
      label="This element is required for publication"
    />
  </FieldLayoutVertical>
);
