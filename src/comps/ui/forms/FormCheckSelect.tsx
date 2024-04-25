import { CheckboxProps, FormControl, FormLabel, FormGroup, FormControlLabel, Checkbox } from "@mui/material"

type SelectType = {
    id: string,
    display: string
}

type Props = {
    field: string,
    value?: string[],
    label?: string,
    required?: boolean,
    description?: string,
    onChange?: (field: string, updatedSelections: string[]) => void
    selections: SelectType[]
}

const FormCheckSelect = (
    {
        field,
        value,
        label,
        required,
        description,
        onChange,
        selections,
        ...checkboxProps
    } : Props & CheckboxProps
) => {
    let checked : string[] = value || [];

    const checkboxUpdate = (newSelections : string[]) => {
        if (!onChange) return;
        
        newSelections = newSelections
            .filter(v => v && v.length);

        onChange(field, newSelections)
    }

    return (
        <FormControl>
            {label && (<FormLabel>{label}</FormLabel>)}
            <FormGroup row>
                {
                    selections.map((select, i) => {

                    return (
                        <FormControlLabel 
                        control={
                            <Checkbox
                                key={i}
                                checked={checked.includes(select.id)}
                                onChange={(event) => {
                                    if (event.target.checked && !checked.includes(select.id)) {
                                        checkboxUpdate([...checked, select.id]);
                                    } else {
                                        checkboxUpdate(checked.filter(id => id !== select.id));
                                    }
                                }}
                                name={select.display}
                                {...checkboxProps}
                            />
                        }
                        label={select.display}
                        />
                    )
                    })
                }
            </FormGroup>
        </FormControl>
    )
}

export default FormCheckSelect;