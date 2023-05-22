import { UserIdentity } from "./UserIdentity";

export class AuditMetadata {
  createdBy: UserIdentity | null | undefined = null;
  createdOn: Date = new Date();
  modifiedBy: UserIdentity | null | undefined = null;
  modifiedOn: Date = new Date();
}
