import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import AccountSettings from "@/components/dashboard/AccountSettings";
export const instant=false;
export const metadata={title:"Tài khoản · Vị Xoài Dẫn Lối"};
export default async function SettingsPage(){const session=await getSession();if(!session)redirect("/login?next=/dashboard/settings");return <AccountSettings name={session.name} email={session.email} provider={session.provider} picture={session.picture}/>;}
