import { listStaffMembers } from "@/actions/staff";
import { StaffProfilesManager } from "@/components/staff/StaffProfilesManager";

export default async function StaffPage() {
  const staff = await listStaffMembers(true);
  return <StaffProfilesManager initialStaff={staff} />;
}
