import {Avatar, Typography,Box,IconButton,Icon, Popover} from '@material-ui/core';
import {useState} from 'react';

interface UserProps{
    photo: string,
    email: string,
    status: string,
    onClick: any,
    newMessages: number,
    blocked: boolean,
    blockUnblockContact:()=>void
}
const UserListItem=(props: UserProps)=>{

    const [anchorEl, setAnchorEl] = useState(null);

    const handleClick = (event:any,contactEmail:string) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const callback=()=>{
        props.blockUnblockContact();
        handleClose();
    }
  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;
    return (
       <div style={{display:"flex",justifyContent:"space-between"}}>
           <Box onClick={()=>{props.onClick()}} className="users-list-item">
           <Avatar alt={props.email} src={props.photo}/>
           <Box style={{width:"90%"}}>
                <Typography className="user-name">{props.email}</Typography>
                <Box className="status">
                    <Box className="status-indicator">
                        <Box className="indicator" style={{backgroundColor: props.status === "online" ? "rgb(39, 206, 39)": "#f17438"}}/>
                        <Typography className="indicator-text">{props.status}</Typography>
                    </Box>
                    {props.newMessages > 0 ? <Box className="new-message-indicator">{props.newMessages}</Box> : null}
                </Box>
           </Box>
       </Box>


        <IconButton onClick={(e)=>{handleClick(e,props.email)}}>
            <Icon style={{color:"white"}}>
                more_vert 
            </Icon>
        </IconButton>

        <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
          <Box p={2} onClick={callback} style={{cursor: "pointer"}}>
            <Typography>{props.blocked ? "Unblock": "Block"}</Typography>
          </Box>
      </Popover>
       </div>
    )
}

export default UserListItem;