import { Box, TextField, Button, Typography, Card } from "@mui/material";

import { useState, useEffect } from "react";

import OrgSelector from "../../comps/admin/OrgSelector";

import { supabase } from "../../supabaseClient";
import { useSnackbar } from "notistack";

const Strikes = () => {
    const { enqueueSnackbar } = useSnackbar();

    const [orgId, setOrgId] = useState<Number>();
    const [orgName, setOrgName] = useState("");
    const [orgStrikes, setOrgStrikes] = useState<Strike[]>([]);

    const [reason, setReason] = useState("");

    useEffect(() => {
        if (!orgId) return;

        const fetchOrgStrikes = async () => {
            const { data, error } = await supabase
                .from("strikes")
                .select(
                    `
                    id,
                    reason,
                    created_at,
                    organizations (
                        name
                    ),
                    users (
                        first_name,
                        last_name,
                        picture
                    )
                `,
                )
                .eq("organization_id", orgId);

            if (error || !data) {
                return enqueueSnackbar(
                    "Failed to load strikes. Contact it@stuysu.org for support.",
                    { variant: "error" },
                );
            }

            setOrgStrikes(data as Strike[]);
        };

        fetchOrgStrikes();
    }, [orgId]);

    const issueStrike = async () => {
        const { data, error } = await supabase.functions.invoke(
            "issue-strike", 
            {
                body: { 
                    organization_id: orgId,
                    reason  
                }
            }
        )

        if (error) {
            enqueueSnackbar(
                "Error issuing strike. Contact it@stuysu.org for support",
                { variant: "error" }
            );
            return;
        }

        setOrgStrikes([...orgStrikes, data as Strike]);
        enqueueSnackbar("Strike issued!", { variant: "success" });
        setReason("");
    }

    return (
        <Box>
            <Typography variant="h1" align="center">Strikes</Typography>
            <Box sx={{ width: "100%", display: "flex", justifyContent: "center", marginTop: "20px" }}>
                <OrgSelector
                    onSelect={(orgId, orgName) => {
                        setReason("");
                        setOrgId(orgId);
                        setOrgName(orgName);
                    }}
                />
            </Box>

            {
                orgId && (
                    <>
                        <Box sx={{ width: "100%", display: "flex", justifyContent: "center", flexWrap: "wrap" }}>
                            <Typography variant="h2" width="100%" align="center">Org: {orgName}</Typography>
                            <Box sx={{ width: "500px", display: "flex", justifyContent: "center", flexWrap: "wrap"}}>
                                <Typography variant="h3" width="100%">Give Strike</Typography>
                                <TextField
                                    sx={{ width: "100%" }} 
                                    label="Reason" 
                                    value={reason} 
                                    onChange={e => setReason(e.target.value)}
                                    multiline
                                    rows={4} 
                                />
                                <Button onClick={issueStrike} variant="contained" sx={{ width: "100%", marginTop: "10px"}}>Issue</Button>
                            </Box>
                        </Box>

                        <Box sx={{ marginTop: "10px", width: "100%", display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
                            {
                                orgStrikes.map((strike, i) => (
                                    <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
                                        <Card key={i} sx={{ width: "500px", padding: "20px", marginTop: "10px", marginBottom: "10px"}}>
                                            <Typography variant="h2">{strike.reason}</Typography>
                                            <Typography variant="body1">Issued by {strike.users?.first_name} {strike.users?.last_name}</Typography>
                                            <Button onClick={async () => {
                                                const { error } = await supabase
                                                    .from("strikes")
                                                    .delete()
                                                    .eq("id", strike.id);

                                                if (error) {
                                                    enqueueSnackbar(
                                                        "Error deleting strike. Contact it@stuysu.org for support",
                                                        { variant: "error" }
                                                    )
                                                }

                                                setOrgStrikes(orgStrikes.filter(s => s.id !== strike.id));
                                                enqueueSnackbar("Strike deleted!", { variant: "success" });
                                            }}>Delete</Button>
                                        </Card>
                                    </Box>
                                ))
                            }
                        </Box>
                    </>
                )
            }
        </Box>
    );
};

export default Strikes;
