import {Box,Typography} from '@material-ui/core';


interface MessageProps{
    message: string,
    dateTime: string,
    fromSender: boolean
}
const MessageBox=(props: MessageProps)=>{
    return (
        <Box className={props.fromSender ? "from-sender" : "from-recipient"}>
           <Box className={props.fromSender ? "from-sender-box" : "from-recipient-box"}>
            <Typography className="msg-date">{props.dateTime}</Typography>
            <Typography className="msg-text">{props.message}</Typography>
           </Box>
        </Box>
    );
}
export default MessageBox;