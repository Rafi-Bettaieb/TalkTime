import { Avatar } from "@chakra-ui/avatar";
import { Tooltip } from "@chakra-ui/tooltip";
import ScrollableFeed from "react-scrollable-feed";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../Context/ChatProvider";
import Lottie from "react-lottie";
import animationData from "../animation/typing.json"; 

const ScrollableChat = ({ messages, istyping }) => {
  const { user } = ChatState();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  const renderContent = (m) => {

    if (m.contentType === "image") {
        return (
            <img 
                src={m.content} 
                alt={m.fileName || "image"} 
                style={{maxWidth: "250px", borderRadius: "8px", cursor: "pointer"}}
                onClick={() => window.open(m.content, "_blank")}
            />
        );
    } else if (m.contentType === "video") {
        return (
            <video 
                src={m.content} 
                controls 
                style={{maxWidth: "300px", borderRadius: "8px"}} 
            />
        );
    } else if (m.contentType === "application") {
        return (
            <a href={m.content} target="_blank" rel="noreferrer" style={{display: "flex", alignItems: "center", gap: "5px", color: "black", textDecoration: "none", background: "rgba(255,255,255,0.5)", padding: "5px 10px", borderRadius: "5px"}}>
                <span style={{fontSize: "20px"}}>📄</span> 
                <span style={{textDecoration: "underline"}}>{m.fileName || "Download File"}</span>
            </a>
        );
    } else {
        return m.content;
    }
  };

  return (
    <ScrollableFeed>
      {messages &&
        messages.map((m, i) => (
          <div style={{ display: "flex" }} key={m._id}>
            {(isSameSender(messages, m, i, user._id) ||
              isLastMessage(messages, i, user._id)) && (
              <Tooltip label={m.sender.name} placement="bottom-start" hasArrow>
                <Avatar
                  mt="7px"
                  mr={1}
                  size="sm"
                  cursor="pointer"
                  name={m.sender.name}
                  src={m.sender.pic}
                />
              </Tooltip>
            )}
            <span
              style={{
                backgroundColor: `${
                  m.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"
                }`,
                marginLeft: isSameSenderMargin(messages, m, i, user._id),
                marginTop: isSameUser(messages, m, i, user._id) ? 3 : 10,
                borderRadius: "20px",
                padding: "5px 15px",
                maxWidth: "75%",
              }}
            >
              {renderContent(m)}
            </span>
          </div>
        ))}

      {istyping && (
         <div style={{ display: "flex", marginTop: "10px", marginLeft: "10px" }}>
             <div
                 style={{
                     backgroundColor: "#B9F5D0",
                     borderRadius: "20px",
                     padding: "10px 15px",
                     width: "70px",
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center"
                 }}
             >
                 <Lottie
                    options={defaultOptions}
                    width={40}
                    height={20}
                    style={{ margin: 0 }}
                  />
             </div>
         </div>
      )}
    </ScrollableFeed>
  );
};

export default ScrollableChat;