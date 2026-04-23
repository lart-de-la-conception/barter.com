import { MessagesPage } from "@/components/marketplace-pages";
import { getMessagesPageData, getProfilesBySlugs, requireViewer } from "@/lib/data/marketplace";

export default async function MessagesRoute() {
  await requireViewer("/messages");
  const { conversations } = await getMessagesPageData();
  const users = await getProfilesBySlugs(conversations.map((conversation) => conversation.userId));
  const usersById = Object.fromEntries(users.map((user) => [user.id, user]));

  return <MessagesPage conversations={conversations} usersById={usersById} />;
}
