import { SegmentedControl, SettingRow } from "@apx/ui";
import { AgentSelect } from "../../common/pickers/AgentSelect.tsx";
import type { ChannelDraft } from "../../data/channels.ts";
import { useT } from "../../i18n/index.ts";
import type { PaneProps } from "./types.ts";

/**
 * Who answers: the agent the owner talks to here (the super-agent, always first, or a project's head, found by project
 * in the picker), whose own account chat holds the owner's words, and who answers the contacts and rooms.
 */
export function AnswerPane({ channel, draft, set }: Pick<PaneProps, "channel" | "draft" | "set">) {
  const t = useT();
  return (
    <>
      <SettingRow title={t("tg.ownerAgent")} description={t("tg.ownerAgentHint", { channel: channel.label })}>
        <AgentSelect
          size="sm"
          className="tgagent"
          channel
          value={draft.agent_id}
          onChange={(id) => id && set({ agent_id: id })}
        />
      </SettingRow>
      <SettingRow title={t("ch.service")} description={t(`ch.serviceHint.${draft.service_mode ?? "base"}`)}>
        <SegmentedControl
          size="sm"
          label={t("ch.service")}
          value={draft.service_mode ?? "base"}
          onValueChange={(value) => set({ service_mode: value as ChannelDraft["service_mode"] })}
          options={[
            { value: "base", label: t("ch.service.base") },
            { value: "review", label: t("ch.service.review") },
            { value: "full", label: t("ch.service.full") },
          ]}
        />
      </SettingRow>
      <SettingRow title={t("tg.contactsAgent")} description={t("tg.contactsAgentHint", { channel: channel.label })}>
        <AgentSelect
          size="sm"
          className="tgagent"
          channel
          value={draft.contacts_agent_id ?? draft.agent_id}
          onChange={(id) => id && set({ contacts_agent_id: id })}
        />
      </SettingRow>
    </>
  );
}
