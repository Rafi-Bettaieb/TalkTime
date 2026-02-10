import { FormControl } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Box, Text, Button } from "@chakra-ui/react";
import "./styles.css";
import { IconButton, Spinner, useToast } from "@chakra-ui/react";
import { getSender, getSenderFull } from "../config/ChatLogics";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { ArrowBackIcon, AttachmentIcon, StarIcon } from "@chakra-ui/icons"; 
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";

import io from "socket.io-client";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import { ChatState } from "../Context/ChatProvider";

const ENDPOINT = "http://localhost:5000";
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  
  const [suggestions, setSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  
  const toast = useToast();
  const fileInputRef = useRef(null); 

  const { selectedChat, setSelectedChat, user, notification, setNotification } = ChatState();

  const fetchMessages = async () => {
    if (!selectedChat) return;
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      setLoading(true);
      const { data } = await axios.get(`/api/message/${selectedChat._id}`, config);
      setMessages(data);
      setLoading(false);
      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const handleManualAiGen = () => {
    const lastIncomingMessage = [...messages].reverse().find(
      (m) => m.sender._id !== user._id && !m.fileName 
    );

    if (!lastIncomingMessage) {
      toast({
        title: "No message to reply to!",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    setAiLoading(true);
    fetchSuggestions(lastIncomingMessage.content);
  };

  const fetchSuggestions = async (messageText) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      const { data } = await axios.post(
        "/api/ai/suggest",
        { messageReceived: messageText },
        config
      );
      
      setSuggestions(data);
      setAiLoading(false);
    } catch (error) {
      console.error("Failed to fetch suggestions");
      setAiLoading(false);
      toast({
        title: "AI Busy",
        description: "Could not generate suggestions right now.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setNewMessage(suggestion);
    setSuggestions([]); 
  };

  const sendMessage = async (event) => {
    if (event.key === "Enter" && newMessage) {
      socket.emit("stop typing", selectedChat._id);
      setSuggestions([]); 
      try {
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        setNewMessage("");
        const { data } = await axios.post(
          "/api/message",
          {
            content: newMessage,
            chatId: selectedChat._id,
          },
          config
        );
        socket.emit("new message", data);
        setMessages([...messages, data]);
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  const sendFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatId", selectedChat._id);
    try {
        const config = {
            headers: { Authorization: `Bearer ${user.token}` },
        };
        const { data } = await axios.post("/api/message", formData, config);
        socket.emit("new message", data);
        setMessages([...messages, data]);
    } catch (error) {
        toast({
            title: "Error Occured!",
            description: "Failed to send file",
            status: "error",
            duration: 5000,
            isClosable: true,
            position: "bottom",
        });
    }
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
  }, [user]);

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
    setSuggestions([]); 
  }, [selectedChat]);

  useEffect(() => {
    const handleMessageReceived = (newMessageRecieved) => {
      if (!selectedChatCompare || selectedChatCompare._id !== newMessageRecieved.chat._id) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages([...messages, newMessageRecieved]);
      }
    };

    socket.on("message recieved", handleMessageReceived);

    return () => {
      socket.off("message recieved", handleMessageReceived);
    };
  });

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    
    if(e.target.value.length > 0 && suggestions.length > 0) {
        setSuggestions([]);
    }

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            display="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {messages &&
              (!selectedChat.isGroupChat ? (
                <>
                  {getSender(user, selectedChat.users)}
                  <ProfileModal user={getSenderFull(user, selectedChat.users)} />
                </>
              ) : (
                <>
                  {selectedChat.chatName.toUpperCase()}
                  <UpdateGroupChatModal
                    fetchMessages={fetchMessages}
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                  />
                </>
              ))}
          </Text>
          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner size="xl" w={20} h={20} alignSelf="center" margin="auto" />
            ) : (
              <div className="messages">
                <ScrollableChat messages={messages} istyping={istyping} />
              </div>
            )}
            
            {suggestions.length > 0 && (
              <Box 
                display="flex"
                flexDirection="column" 
                width="100%"
                mb={3}
                p={2}
                bg="transparent"
              >
                <Text fontSize="sm" color="gray.600" ml={2} mb={2} fontWeight="bold">
                  Suggestions:
                </Text>
                
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    width="100%"
                    variant="solid"
                    colorScheme="whiteAlpha"
                    bg="white"
                    color="black"
                    border="1px solid"
                    borderColor="gray.300"
                    size="lg"
                    mb={3}
                    onClick={() => handleSuggestionClick(suggestion)}
                    justifyContent="flex-start" 
                    textAlign="left"
                    whiteSpace="normal" 
                    height="auto"
                    py={4}
                    px={4}
                    borderRadius="xl"
                    boxShadow="sm"
                    _hover={{ bg: "gray.50" }}
                    style={{ wordBreak: "break-word" }}
                  >
                    <Text fontSize="md">{suggestion}</Text>
                  </Button>
                ))}
              </Box>
            )}

            <FormControl
              onKeyDown={sendMessage}
              id="first-name"
              isRequired
              mt={3}
              display="flex" 
              alignItems="center"
            >
              <input 
                type="file" 
                style={{ display: "none" }} 
                ref={fileInputRef} 
                onChange={sendFile} 
              />
              <IconButton 
                  icon={<AttachmentIcon />} 
                  onClick={() => fileInputRef.current.click()} 
                  mr={2}
                  bg="#E0E0E0"
                  aria-label="Attach File"
              />

              <IconButton 
                  icon={<StarIcon />} 
                  onClick={handleManualAiGen}
                  isLoading={aiLoading}
                  mr={2}
                  bg="#E0E0E0"
                  color="purple.500"
                  aria-label="Generate AI Reply"
              />

              <Input
                variant="filled"
                bg="#E0E0E0"
                placeholder="Enter a message.."
                value={newMessage}
                onChange={typingHandler}
              />
            </FormControl>
          </Box>
        </>
      ) : (
        <Box display="flex" alignItems="center" justifyContent="center" h="100%">
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;