import { useContext } from "react";
import OrgContext from "../../../comps/context/OrgContext";
import UserContext from "../../../comps/context/UserContext";

import AdminMember from "../../../comps/pages/orgs/admin/AdminMember";
import { Box, Typography } from "@mui/material";

import { sortByRole } from "../../../utils/DataFormatters";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

const Members = () => {
    const user = useContext(UserContext);
    const organization = useContext<OrgContextType>(OrgContext);
    const members = organization.memberships
        .filter((member) => member.active)
        .map((member) => {
            return {
                first_name: member.users?.first_name,
                last_name: member.users?.last_name,
                email: member.users?.email,
                membershipId: member.id,
                userId: member.users?.id,
                picture: member.users?.picture,
                role_name: member.role_name,
                role: member.role,
                is_faculty: member.users?.is_faculty,
            };
        });

    const userMember = organization.memberships.find(
        (member) => member.users?.id === user.id,
    );
    const emailString = members.map((member) => member.email).join(",");
    console.log(emailString);

    const handleClick = () => {
        const stringToCopy = emailString;
        navigator.clipboard.writeText(stringToCopy);
    };

    return (
        <Box sx={{ width: "100%" }}>
            <Typography variant="h1" align="center" width="100%">
                Message Members
            </Typography>
            <TextField
                id="outlined-basic"
                fullWidth
                disabled
                label={emailString}
                variant="outlined"
                color="success"
            />
            <Button variant="contained" color="primary" onClick={handleClick}>
                Button
            </Button>
            {members
                ?.sort(sortByRole)
                .map((member, i) => (
                    <AdminMember
                        id={member.membershipId || -1}
                        userId={member.userId || -1}
                        first_name={member.first_name || "First"}
                        last_name={member.last_name || "Last"}
                        email={member.email || ""}
                        picture={member.picture}
                        role={member.role || "MEMBER"}
                        role_name={member.role_name}
                        isCreator={userMember?.role === "CREATOR"}
                        isAdmin={userMember?.role === "ADMIN"}
                        is_faculty={member.is_faculty}
                        key={i}
                    />
                ))}
        </Box>
    );
};

export default Members;
