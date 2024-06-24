import { CampaignId } from "@/app/[username]/[campaign_slug]/campaign_id";
import { LidndAuth, UserUtils } from "@/app/authentication";
import { ServerCampaign } from "@/server/campaigns";
import { isCampaignSlug } from "@/server/utils";
import React from "react";

export default async function CampaignLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: unknown;
}) {
  const user = await LidndAuth.getUser();

  if (!user) {
    console.error("No session found, layout should have redirected");
    return <div>User not logged in</div>;
  }

  if (!isCampaignSlug(params)) {
    console.error("params object has missing fields");
    return;
  }

  const campaign = await ServerCampaign.campaignFromSlug(
    UserUtils.context(user),
    params.campaign_slug,
  );

  if (!campaign) {
    return <div>No campaign found -- bug!</div>;
  }

  return <CampaignId value={campaign.id}>{children}</CampaignId>;
}
