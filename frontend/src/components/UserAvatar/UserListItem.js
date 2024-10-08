import { Avatar } from "@chakra-ui/avatar";
import { Box, Text, Flex } from "@chakra-ui/layout";

const UserListItem = ({ user, handleFunction }) => {
  return (
    <Box
      onClick={handleFunction}
      cursor="pointer"
      bg="#E8E8E8"
      _hover={{
        background: "#FF5416",
        color: "white",
      }}
      w="100%"
      color="black"
      px={3}
      py={2}
      mb={2}
      borderRadius="lg"
    >
      <Flex alignItems="center">
        <Avatar
          mr={2}
          size="sm"
          cursor="pointer"
          name={user.name}
          src={user.pic}
        />
        <Box>
          <Text>{user.name}</Text>
          <Text fontSize="xs">
            <b>Email:</b> {user.email}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};

export default UserListItem;
