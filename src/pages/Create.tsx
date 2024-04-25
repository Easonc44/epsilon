import { CSSProperties, useContext, useState } from "react";
import UserContext from "../comps/context/UserContext";

import { useNavigate } from "react-router-dom";
import MultiPageForm from "../comps/ui/forms/MultiPageForm";
import FormPage from "../comps/ui/forms/FormPage";
import FormTextField from "../comps/ui/forms/FormTextField";
import FormDropSelect from "../comps/ui/forms/FormDropSelect";
import FormCheckSelect from "../comps/ui/forms/FormCheckSelect";

import { supabase } from "../supabaseClient";
import FormUpload from "../comps/ui/forms/FormUpload";
import { useSnackbar } from "notistack";
import FormSection from "../comps/ui/forms/FormSection";

type FormType = {
  name: string,
  url: string,
  socials: string,
  picture?: File,
  mission: string,
  purpose: string,
  benefit: string,
  appointment_procedures: string,
  uniqueness: string,
  meeting_schedule: string,
  meeting_days: string,
  keywords: string,
  tags: string,
  commitment_level: string,
  join_instructions: string
}

const emptyForm : FormType = {
  name: "",
  url: "",
  socials: "",
  picture: undefined,
  mission: "",
  purpose: "",
  benefit: "",
  appointment_procedures: "",
  uniqueness: "",
  meeting_schedule: "",
  meeting_days: "",
  keywords: "",
  tags: "",
  commitment_level: "",
  join_instructions: ""
}

const multilineStyle : CSSProperties = {
  width: "50%",
  minWidth: "500px",
  display: "flex",
  marginTop: "20px"
}


const Create = () => {
  const user = useContext(UserContext);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormType>(emptyForm);

  const createActivity = async () => {
    let payload = {
      creator_id: user.id,
      name: formData.name,
      url: formData.url,
      socials: formData.socials,
      picture: null, // update after creating initial org
      mission: formData.mission,
      purpose: formData.purpose,
      benefit: formData.benefit,
      appointment_procedures: formData.appointment_procedures,
      uniqueness: formData.uniqueness,
      meeting_schedule: formData.meeting_schedule,
      meeting_days: formData.meeting_days,
      keywords: formData.keywords,
      tags: formData.tags,
      commitment_level: formData.commitment_level,
      join_instructions: formData.join_instructions,
    }

    let { data: orgCreateData, error: orgCreateError } = await supabase
      .from("organizations")
      .insert(payload)
      .select(`
        id
      `);

    if (orgCreateError || !orgCreateData) {
      return enqueueSnackbar(
        "Error creating organization. Contact it@stuysu.org for support.",
        { variant: "error" }
      );
    }

    let orgId = orgCreateData[0].id;

    /* Create picture if organization is successfully created */
    
    /* convert picture to url */
    if (formData.picture) {
      let filePath = `org-pictures/${orgId}/${Date.now()}-${formData.picture.name}`
      let { data: storageData, error: storageError } = await supabase
        .storage
        .from('public-files')
        .upload(filePath, formData.picture);
      
      if (storageError || !storageData) {
        /* attempt to delete organization */
        await supabase
          .from('organizations')
          .delete()
          .eq('id', orgId)
        return enqueueSnackbar(
          "Error uploading image to storage. Contact it@stuysu.org for support.",
          { variant: "error" }
        )
      }

      let { data: urlData } = await supabase
      .storage
      .from('public-files')
      .getPublicUrl(filePath)

      if (!urlData) {
        /* attempt to delete organization */
        await supabase
          .from('organizations')
          .delete()
          .eq('id', orgId)

        return enqueueSnackbar(
          "Failed to retrieve image after upload. Contact it@stuysu.org for support.",
          { variant: "error" }
        );
      }

      
      let { error: updateUrlError } = await supabase
          .from("organizations")
          .update({ picture: urlData.publicUrl })
          .eq('id', orgId)

      if (updateUrlError) {
        /* attempt to delete organization */
        await supabase
          .from('organizations')
          .delete()
          .eq('id', orgId)
        return enqueueSnackbar(
          "Error uploading image to organization. Contact it@stuysu.org for support.",
          { variant: "error" }
        )
      }
    }
    
    enqueueSnackbar("Organization created!", { variant: "success" });
    /* redirect after creation */
    navigate(`/${formData.url}`)
  };
  
  return (
    <MultiPageForm
      title="Create New Organization" 
      value={formData} 
      onFormChange={setFormData}
      onSubmit={createActivity}
      submitText="Create Activity"
      width="100%"
    >
      <FormPage title="Basic Info">
        <FormSection bgcolor='red'>
          <FormTextField 
              label="Name"
              field="name"
              required
              requirements={{
                minChar: 3,
                maxChar: 40,
                onlyAlpha: true
              }}
          />
          <FormTextField
            label="Url"
            field="url"
            required
            requirements={{
              minChar: 3,
              maxChar: 40,
              disableSpaces: true,
              onlyAlpha: true
            }}
          />
        </FormSection>
        <FormDropSelect 
          label="Commitment Level"
          field="commitment_level"
          required
          selections={[
            {
              id: 'NONE',
              display: 'None'
            },
            {
              id: 'LOW',
              display: "Low"
            },
            {
              id: 'MEDIUM',
              display: "Medium"
            },
            {
              id: 'HIGH',
              display: "High"
            }
          ]}
        />
        <FormTextField 
          label="Socials (optional)"
          field="socials"
        />

        <FormUpload 
          field="picture"
          display
        />
      </FormPage>

      <FormPage title="Charter Information">
          <FormTextField 
            label="Mission"
            field="mission"
            multiline
            requirements={{
              minChar: 20,
              maxChar: 150
            }}
            sx={multilineStyle}
            rows={4}
            description="A quick blurb of what this organization is all about"
          />
          <FormTextField 
            label="Purpose"
            field="purpose"
            multiline
            requirements={{
              minWords: 100,
              maxWords: 400
            }}
            sx={multilineStyle}
            rows={4}
            description="This will serve as the official description of the club. Please include a brief statement about what is expected of general members involved in the club."
          />
          <FormTextField
            label="Benefit"
            field="benefit"
            multiline
            requirements={{
              minWords: 200,
              maxWords: 400
            }}
            sx={multilineStyle}
            rows={4}
            description="How will this activity benefit the Stuyvesant community?"
          />
          <FormTextField
            label="Appointment Procedures"
            field="appointment_procedures"
            multiline
            requirements={{
              minWords: 50,
              maxWords: 400
            }}
            sx={multilineStyle}
            rows={4}
            description="What are the leadership positions and how are they appointed? Are there any specific protocols members are expected to follow? What is the policy for transfer of leadership between school years? How will leaders be removed if necessary?"
          />
          <FormTextField
            label="Uniqueness"
            field="uniqueness"
            multiline
            requirements={{
              minWords: 75,
              maxWords: 400
            }}
            sx={multilineStyle}
            rows={4}
            description="What makes your organization unique?"
          />
          <FormTextField
            label="Meeting Schedule"
            field="meeting_schedule"
            requirements={{
              minChar: 50,
              maxChar: 1000
            }}
            sx={multilineStyle}
            rows={4}
            description={`Something like "Our meeting schedule varies throughout the year, but we meet at least once a month and up to 3 times in the Spring."`}
          />
          <FormCheckSelect 
            label="Meeting Days"
            field="meeting_days"
            selections={[
              { id: 'MONDAY', display: 'Monday' },
              { id: 'TUESDAY', display: 'Tuesday' },
              { id: 'WEDNESDAY', display: 'Wednesday' },
              { id: 'THURSDAY', display: "Thursday" },
              { id: 'FRIDAY', display: "Friday"}
            ]}
            formatter={choices => choices.join(',')}
          />
      </FormPage>
    </MultiPageForm>
  )
};

export default Create;
