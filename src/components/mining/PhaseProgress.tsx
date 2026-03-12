import { Steps } from 'antd';
import { MiningPhase, PHASE_ORDER, PHASE_LABELS } from '../../types/mining';

interface PhaseProgressProps {
  currentPhase: MiningPhase;
  onClickPhase?: (phase: MiningPhase) => void;
}

const STEP_GROUPS = [
  { label: '领域', phases: [MiningPhase.DOMAIN_INPUT] },
  { label: 'CQ', phases: [MiningPhase.CQ_GENERATION, MiningPhase.CQ_SELECTION, MiningPhase.CQ_EXPANSION, MiningPhase.CQ_CONFIRMATION] },
  { label: '本体', phases: [MiningPhase.ONTOLOGY_EXTRACTION, MiningPhase.ONTOLOGY_REFINEMENT] },
  { label: '工作流', phases: [MiningPhase.WORKFLOW_EXTRACTION, MiningPhase.RELATION_MAPPING] },
  { label: '审查', phases: [MiningPhase.REVIEW] },
  { label: '导出', phases: [MiningPhase.EXPORT] },
];

export function PhaseProgress({ currentPhase, onClickPhase }: PhaseProgressProps) {
  const currentIdx = PHASE_ORDER.indexOf(currentPhase);

  const getGroupStatus = (phases: MiningPhase[]): 'finish' | 'process' | 'wait' => {
    const indices = phases.map(p => PHASE_ORDER.indexOf(p));
    const minIdx = Math.min(...indices);
    const maxIdx = Math.max(...indices);
    if (currentIdx > maxIdx) return 'finish';
    if (currentIdx >= minIdx && currentIdx <= maxIdx) return 'process';
    return 'wait';
  };

  return (
    <Steps
      size="small"
      current={STEP_GROUPS.findIndex(g => g.phases.includes(currentPhase))}
      items={STEP_GROUPS.map((group) => ({
        title: group.label,
        description: group.phases.includes(currentPhase) ? PHASE_LABELS[currentPhase] : undefined,
        status: getGroupStatus(group.phases),
        onClick: () => {
          if (onClickPhase && getGroupStatus(group.phases) === 'finish') {
            onClickPhase(group.phases[0]);
          }
        },
        style: getGroupStatus(group.phases) === 'finish' ? { cursor: 'pointer' } : undefined,
      }))}
    />
  );
}
