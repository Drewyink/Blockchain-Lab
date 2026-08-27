"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mentor } from "./Mentor";
import { SandboxState } from "@/lib/sandbox-engine";
import { completeMission } from "@/lib/api-client";

import { TransactionForm } from "@/components/primitives/missions/TransactionForm";
import { HashEngineDemo } from "@/components/primitives/missions/HashEngineDemo";
import { GenesisBlockBuilder } from "@/components/primitives/missions/GenesisBlockBuilder";
import { ChainBuilder } from "@/components/primitives/missions/ChainBuilder";
import { ChainIntegrityCheck } from "@/components/primitives/missions/ChainIntegrityCheck";
import { AttackChain } from "@/components/primitives/missions/AttackChain";
import { ForensicRepair } from "@/components/primitives/missions/ForensicRepair";
import { KeypairGenerator } from "@/components/primitives/missions/KeypairGenerator";
import { SignatureLab } from "@/components/primitives/missions/SignatureLab";
import { ForensicAssessment } from "@/components/primitives/missions/ForensicAssessment";
import { NodeNetworkLab } from "@/components/primitives/missions/NodeNetworkLab";
import { PropagationLab } from "@/components/primitives/missions/PropagationLab";
import { MiningLab } from "@/components/primitives/missions/MiningLab";
import { ForkResolutionLab } from "@/components/primitives/missions/ForkResolutionLab";
import { MaliciousNodeLab } from "@/components/primitives/missions/MaliciousNodeLab";
import { NetworkAssessment } from "@/components/primitives/missions/NetworkAssessment";

export type MissionData = {
  slug: string;
  order: number;
  title: string;
  problemPrompt: string;
  narrative: string;
  primitiveKey: string;
  mode: string;
  config: Record<string, unknown>;
};

export function MissionPlayer({
  mission,
  initialState,
  completeRedirect,
}: {
  mission: MissionData;
  initialState: SandboxState;
  completeRedirect: string;
}) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [lastErrorCode, setLastErrorCode] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [credentialIssued, setCredentialIssued] = useState<{ title: string; verificationId: string } | null>(null);

  async function handleSuccess() {
    setLastErrorCode(null);
    setCompleted(true);
    const res = await completeMission(mission.slug, "success");
    if (res.credentialIssued) setCredentialIssued(res.credentialIssued);
  }

  function handleError(code: string) {
    setLastErrorCode(code);
  }

  function goNext() {
    router.push(completeRedirect);
  }

  const primitiveProps = {
    config: mission.config,
    state,
    onStateChange: setState,
    onError: handleError,
    onSuccess: handleSuccess,
    missionSlug: mission.slug,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6">
        <p className="eyebrow">
          Mission {String(mission.order).padStart(2, "0")}
          {mission.mode === "assessment" && <span className="ml-2 text-signal-pending">· Assessment</span>}
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{mission.title}</h1>
        <p className="mt-3 max-w-2xl text-base text-lab-300">{mission.problemPrompt}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="lab-panel min-h-[420px] p-4 sm:p-6">
          {mission.primitiveKey === "transaction-form" && <TransactionForm {...primitiveProps} />}
          {mission.primitiveKey === "hash-engine" && <HashEngineDemo {...primitiveProps} />}
          {mission.primitiveKey === "block-builder" && <GenesisBlockBuilder {...primitiveProps} />}
          {mission.primitiveKey === "chain-builder" && (
            <ChainBuilder {...primitiveProps} targetLength={(mission.config as any).targetChainLength ?? 4} />
          )}
          {mission.primitiveKey === "chain-integrity" && <ChainIntegrityCheck {...primitiveProps} />}
          {mission.primitiveKey === "attack-chain" && <AttackChain {...primitiveProps} />}
          {mission.primitiveKey === "forensic-inspector" && <ForensicRepair {...primitiveProps} />}
          {mission.primitiveKey === "keypair-visualizer" && <KeypairGenerator {...primitiveProps} />}
          {mission.primitiveKey === "signature-visualizer" && <SignatureLab {...primitiveProps} />}
          {mission.primitiveKey === "node-network" && (
            <NodeNetworkLab {...primitiveProps} nodeCount={(mission.config as any).nodeCount ?? 5} />
          )}
          {mission.primitiveKey === "propagation" && <PropagationLab {...primitiveProps} />}
          {mission.primitiveKey === "mining-lab" && (
            <MiningLab {...primitiveProps} difficulty={(mission.config as any).difficulty ?? 4} />
          )}
          {mission.primitiveKey === "fork-resolution" && <ForkResolutionLab {...primitiveProps} />}
          {mission.primitiveKey === "malicious-detector" && (
            <MaliciousNodeLab {...primitiveProps} nodeCount={(mission.config as any).nodeCount ?? 5} />
          )}
          {mission.primitiveKey === "forensic-assessment" && (
            <ForensicAssessment
              missionSlug={mission.slug}
              config={mission.config}
              onComplete={(passed) => {
                if (passed) handleSuccess();
              }}
            />
          )}
          {mission.primitiveKey === "network-assessment" && (
            <NetworkAssessment
              missionSlug={mission.slug}
              config={mission.config}
              onComplete={(passed) => {
                if (passed) handleSuccess();
              }}
            />
          )}

          {completed && (
            <div className="mt-6 animate-rise-in rounded-lg border border-signal-valid/40 bg-signal-valid/10 p-4">
              <p className="font-display text-sm font-semibold text-signal-valid">Competency demonstrated ✓</p>
              {credentialIssued && (
                <p className="mt-1 text-sm text-lab-200">
                  You've just earned <span className="font-semibold text-white">{credentialIssued.title}</span> —
                  verification ID <span className="font-mono">{credentialIssued.verificationId}</span>.
                </p>
              )}
              <button onClick={goNext} className="btn-primary mt-3">
                Continue
              </button>
            </div>
          )}
        </div>

        <Mentor
          missionSlug={mission.slug}
          narrative={mission.narrative}
          lastErrorCode={completed ? null : lastErrorCode}
          maxHintLevel={mission.mode === "assessment" ? (mission.config as any).maxHints : undefined}
        />
      </div>
    </div>
  );
}
