import React from "react";
import { FieldWrapper } from "../../editorial-source-components/FieldWrapper";
import { Label } from "../../editorial-source-components/Label";
import type { FieldValidationErrors } from "../../plugin/elementSpec";
import type { FieldNameToValueMap } from "../../plugin/fieldViews/helpers";
import type { CustomField, FieldNameToField } from "../../plugin/types/Element";
import { CustomDropdownView } from "../../renderers/react/customFieldViewComponents/CustomDropdownView";
import { getFieldViewTestId } from "../../renderers/react/FieldView";
import { useCustomFieldState } from "../../renderers/react/useCustomFieldViewState";
import type { createImageFields, DemoSetMedia } from "./DemoImageElement";

type Props = {
  fieldValues: FieldNameToValueMap<ReturnType<typeof createImageFields>>;
  errors: FieldValidationErrors;
  fields: FieldNameToField<ReturnType<typeof createImageFields>>;
};

export const ImageElementTestId = "ImageElement";
export const UpdateAltTextButtonId = "UpdateAltTextButton";

export const ImageElementForm: React.FunctionComponent<Props> = ({
  fields,
  errors,
  fieldValues,
}) => (
  <div data-cy={ImageElementTestId}>
    <FieldWrapper
      label="Caption"
      field={fields.caption}
      errors={errors.caption}
    />
    <FieldWrapper
      label="Alt text"
      field={fields.altText}
      errors={errors.altText}
    />
    <button
      data-cy={UpdateAltTextButtonId}
      onClick={() => fields.altText.update("Default alt text")}
    >
      Programmatically update alt text
    </button>
    <FieldWrapper
      field={fields.restrictedTextField}
      label="Restricted Text Field"
      errors={errors.restrictedTextField}
    />
    <FieldWrapper label="Src" field={fields.src} errors={errors.src} />
    <FieldWrapper label="Code" field={fields.code} errors={errors.code} />
    <FieldWrapper
      label="Use image source?"
      field={fields.useSrc}
      errors={errors.useSrc}
    />
    <FieldWrapper
      label="Options"
      field={fields.optionDropdown}
      errors={errors.optionDropdown}
    />
    <ImageView
      field={fields.mainImage}
      onChange={(_, __, ___, description) => {
        fields.altText.update(description);
        fields.caption.update(description);
      }}
    />
    <CustomDropdownView label="Options" field={fields.customDropdown} />
    <hr />
    <Label>Element errors</Label>
    <pre>{JSON.stringify(errors)}</pre>
    <hr />
    <Label>Element values</Label>
    <pre>{JSON.stringify(fieldValues)}</pre>
  </div>
);

type ImageViewProps = {
  onChange: DemoSetMedia;
  field: CustomField<
    {
      mediaId?: string;
      mediaApiUri?: string;
      assets: string[];
    },
    {
      onSelectImage: (setMedia: DemoSetMedia) => void;
      onCropImage: (mediaId: string, setMedia: DemoSetMedia) => void;
    }
  >;
};

const ImageView = ({ field, onChange }: ImageViewProps) => {
  const [imageFields, setImageFields] = useCustomFieldState(field);

  const setMedia = (
    mediaId: string,
    mediaApiUri: string,
    assets: string[],
    description: string
  ) => {
    setImageFields({ mediaId, mediaApiUri, assets });
    onChange(mediaId, mediaApiUri, assets, description);
  };

  return (
    <div data-cy={getFieldViewTestId(field.name)}>
      {imageFields.assets.length > 0 ? (
        <img style={{ width: "25%" }} src={imageFields.assets[0]}></img>
      ) : null}

      {imageFields.mediaId ? (
        <button
          onClick={() => {
            if (imageFields.mediaId) {
              field.description.props.onCropImage(
                imageFields.mediaId,
                setMedia
              );
            } else {
              field.description.props.onSelectImage(setMedia);
            }
          }}
        >
          Crop Image
        </button>
      ) : (
        <button onClick={() => field.description.props.onSelectImage(setMedia)}>
          Choose Image
        </button>
      )}
    </div>
  );
};
