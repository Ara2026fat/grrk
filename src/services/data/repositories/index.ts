import type {
  Person,
  Company,
  Organization,
  DocumentRecord,
  CommunicationEntry,
  MasterDataRecord,
  Contact,
  Conversation,
  Message,
} from "@/types/entities";
import type { NotificationRecord } from "@/services/notifications/NotificationEngine";
import { BaseSupabaseRepository } from "../BaseSupabaseRepository";

export const personRepository = new BaseSupabaseRepository<Person>("persons", "person");
export const companyRepository = new BaseSupabaseRepository<Company>("companies", "company");
export const organizationRepository = new BaseSupabaseRepository<Organization>("organizations", "organization");
export const documentRepository = new BaseSupabaseRepository<DocumentRecord>("documents", "document");
export const communicationRepository = new BaseSupabaseRepository<CommunicationEntry>(
  "communicationEntries",
  "communicationEntry"
);
export const masterDataRepository = new BaseSupabaseRepository<MasterDataRecord>("masterData", "masterData");
export const notificationRepository = new BaseSupabaseRepository<NotificationRecord>("notifications", "notification");
export const contactRepository = new BaseSupabaseRepository<Contact>("contacts", "contact");
export const conversationRepository = new BaseSupabaseRepository<Conversation>("conversations", "conversation");
export const messageRepository = new BaseSupabaseRepository<Message>("messages", "message");
