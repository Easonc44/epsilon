import { useState, useEffect, ChangeEvent, useContext } from "react";

import {
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    TextField,
    Select,
    MenuItem,
    SelectChangeEvent,
    DialogActions,
    Switch,
    FormControlLabel,
} from "@mui/material";

import { DatePicker, TimePicker } from "@mui/x-date-pickers";

import { supabase } from "../../../../supabaseClient";
import OrgContext from "../../../context/OrgContext";
import dayjs, { Dayjs } from "dayjs";
import { useSnackbar } from "notistack";

const getDefaultTime = () => {
    return dayjs().startOf('day').hour(15).minute(45)
};

const getDayStart = (day : Dayjs) => {
    let dayStart = new Date(day.year(), day.month(), day.date());
    return dayjs(dayStart);
}

/* TODO: block off rooms on days they are unavailable */
const AdminUpsertMeeting = ({
    id,
    title,
    description,
    room_id,
    start,
    end,
    isPublic,
    open,
    onClose,
    onSave,
}: {
    id?: number;
    title?: string;
    description?: string;
    room_id?: number;
    start?: string;
    end?: string;
    isPublic?: boolean;
    open: boolean;
    onClose: () => void;
    onSave: (saveState: Partial<Meeting>, isInsert: boolean) => void;
}) => {
    const { enqueueSnackbar } = useSnackbar();
    const organization = useContext(OrgContext);

    const [meetingTitle, setMeetingTitle] = useState(title || "");
    const [meetingDesc, setMeetingDesc] = useState(description || "");

    const [roomId, setRoomId] = useState(room_id);

    /* date inputs */
    const [startTime, setStartTime] = useState<Dayjs | null>(
        start ? dayjs(start) : getDefaultTime()
    );
    const [endTime, setEndTime] = useState<Dayjs | null>(
        end ? dayjs(end) : getDefaultTime() 
    )

    const [isPub, setIsPub] = useState(
        isPublic === undefined ? true : isPublic,
    );

    const [allRooms, setAllRooms] = useState<Room[]>([]);
    const [availableRooms, setAvailableRooms] = useState<Room[]>([]);

    // fixes select menu item bug where it is trying to map over undefined rooms
    const [loading, setLoading] = useState(true);

    /* Filtering out rooms that are taken for that day */
    useEffect(() => {
        const fetchRooms = async () => {
            let { data, error } = await supabase.from("rooms").select();

            if (error || !data) {
                enqueueSnackbar(
                    "Error fetching rooms. Contact it@stuysu.org for support.",
                    { variant: "error" },
                );
                return;
            }

            setAllRooms(data);
            setLoading(false);
        };

        fetchRooms();
    }, []);

    useEffect(() => {
        const filterRooms = async () => {
            if (!startTime || !endTime) return; // can't filter without these bounds

            /* 
      get ids of rooms that are booked. 
      there is a special case when we fetch an existing booked room from save
      */
            type roomMeta = {
                room_id: number;
                meeting_id: number;
            }

            let { data, error } = await supabase.rpc("get_booked_rooms", {
                meeting_start: startTime.toISOString(),
                meeting_end: endTime.toISOString(),
            }).returns<roomMeta[]>();

            if (error || !data) {
                enqueueSnackbar(
                    "Error fetching booked rooms. Contact it@stuysu.org for support.",
                    { variant: "error" },
                );
                return;
            }

            data = data.filter(meta => meta.meeting_id !== id); // remove this current meeting's booking from time slot
            
            let availRooms = allRooms.filter(
                (room) => !~data!.findIndex(meta => meta.room_id === room.id), // room does not exist in booked rooms
            )

            // check if the currently selected room id is no longer valid
            if (roomId && ~data.findIndex(meta => meta.room_id === roomId)) {
                setRoomId(undefined);
            }

            setAvailableRooms(
                availRooms
            );
        };

        filterRooms();
    }, [allRooms, startTime, endTime]);

    useEffect(() => {
        // if available room changes due to time, check if room id chosen before is still valid
        
    }, [availableRooms, roomId])

    const handleSave = async () => {
        let supabaseReturn;

        let isCreated = false;
        let isInsert = false;
        let returnSelect = `
            id,
            is_public,
            title,
            description,
            start_time,
            end_time,
            rooms (
                id,
                name,
                floor
            )
        `;

        if (!meetingTitle || !meetingTitle.length) {
            console.log(meetingTitle)
            enqueueSnackbar("Missing meeting title.", { variant: 'error' });
            return;
        }

        if (!startTime) {
            enqueueSnackbar("Missing start time for meeting.", { variant: 'error' });
            return;
        }

        if (!endTime) {
            enqueueSnackbar("Missing end time for meeting.", { variant: 'error' });
            return;
        }

        if (endTime.isBefore(startTime)) {
            enqueueSnackbar("Meeting start time cannot be before meeting end time.", { variant: 'error' })
            return;
        }

        if (id) {
            // update
            supabaseReturn = await supabase
                .from("meetings")
                .update({
                    title: meetingTitle,
                    description: meetingDesc,
                    room_id: roomId || null,
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    is_public: isPub,
                })
                .eq("id", id)
                .select(returnSelect);
        } else {
            // create
            isInsert = true;
            supabaseReturn = await supabase
                .from("meetings")
                .insert({
                    organization_id: organization.id,
                    title: meetingTitle,
                    description: meetingDesc,
                    room_id: roomId || null,
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    is_public: isPub,
                })
                .select(returnSelect);
            isCreated = true;
        }

        if (supabaseReturn.error) {
            enqueueSnackbar(
                "Error creating meeting. Contact it@stuysu.org for support.",
                { variant: "error" },
            );
            return;
        }

        if (isCreated) {
            enqueueSnackbar("Meeting created!", { variant: "success" });
        } else {
            enqueueSnackbar("Meeting updated!", { variant: "success" });
        }

        onSave(supabaseReturn.data[0] as Partial<Meeting>, isInsert);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Upsert Meeting</DialogTitle>
            <DialogContent>
                <TextField
                    value={meetingTitle}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setMeetingTitle(event.target.value)
                    }
                    label="Title"
                />
                <TextField
                    value={meetingDesc}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setMeetingDesc(event.target.value)
                    }
                    label="Description"
                />

                <Select
                    value={!loading ? String(roomId) : ""}
                    label="Room"
                    onChange={(event: SelectChangeEvent) =>
                        setRoomId(Number(event.target.value) || undefined)
                    }
                >
                    <MenuItem value={"undefined"}>Virtual</MenuItem>
                    {availableRooms.map((room) => (
                        <MenuItem key={room.id} value={String(room.id)}>
                            {room.name}
                        </MenuItem>
                    ))}
                </Select>

                <DatePicker 
                    label='Meeting Day'
                    value={startTime}
                    onChange={(newStartTime) => 
                        {
                            if (!newStartTime) return;

                            setStartTime(newStartTime);

                            // also change day of end time
                            if (!endTime) {
                                setEndTime(newStartTime);
                            } else {
                                setEndTime(endTime?.year(newStartTime.year()).month(newStartTime.month()).date(newStartTime.date()))
                            }
                        }
                    }
                />
                <TimePicker 
                    label='Start'
                    value={startTime}
                    onChange={setStartTime}
                />

                <TimePicker 
                    label='End'
                    value={endTime}
                    onChange={setEndTime}
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={isPub}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                setIsPub(event.target.checked)
                            }
                        />
                    }
                    label="is public?"
                />
            </DialogContent>
            <DialogActions>
                <Button variant="contained" onClick={onClose}>
                    Cancel
                </Button>
                <Button variant="contained" onClick={handleSave}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AdminUpsertMeeting;
