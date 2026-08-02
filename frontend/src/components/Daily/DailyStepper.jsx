import { Stack, Group } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import classes from '../../styles/Daily.module.css';

import { STAGE_MASCOTS } from '../../config/Constants.js';

export default function DailyStepper({ currentStep, status, stageResults, onStepClick }) {
    const steps = [
        { id: 1, label: "Characters", desc: "Guess Character" },
        { id: 2, label: "Items", desc: "Guess Item" },
        { id: 3, label: "Song", desc: "Guess Song" }
    ];

    return (
        <div className={classes.stepperContainer}>
            <div className={classes.stepperTrack}>
                {steps.map((step) => {
                    const stepKey = step.id === 1 ? 'characters' : (step.id === 2 ? 'items' : 'songs');
                    const stageResult = stageResults?.[stepKey];
                    const isCompleted = stageResult === 'victory' || stageResult === 'defeat' || currentStep === 'completed' || status === 'victory' || status === 'defeat';
                    const isActive = currentStep === step.id && status === 'playing';

                    let stepClass = classes.stepPending;
                    let iconClass = classes.stepIconPending;
                    let icon = (
                        <img 
                            src={STAGE_MASCOTS[step.id]} 
                            alt="Mascot" 
                            className={classes.lockedStepperMascot} 
                        />
                    );
                    let statusText = step.desc;

                    if (isCompleted) {
                        if (stageResult === 'defeat') {
                            stepClass = classes.stepDefeat;
                            iconClass = classes.stepIconDefeat;
                            icon = <IconX size={20} />;
                            statusText = "Defeat";
                        } else {
                            stepClass = classes.stepCompleted;
                            iconClass = classes.stepIconCompleted;
                            icon = <IconCheck size={20} />;
                            statusText = "Victory";
                        }
                    } else if (isActive) {
                        stepClass = classes.stepActive;
                        iconClass = classes.stepIconActive;
                        statusText = "In Progress";
                    }

                    const isClickable = status === 'playing' || status === 'victory' || status === 'defeat';

                    return (
                        <div 
                            key={step.id} 
                            className={`${classes.step} ${stepClass} ${isClickable ? classes.stepClickable : ''} ${isActive ? classes.stepSelected : ''}`}
                            onClick={() => {
                                if (isClickable && onStepClick) {
                                    onStepClick(step.id);
                                }
                            }}
                            style={{ cursor: isClickable ? 'pointer' : 'default' }}
                        >
                            <div className={`${classes.stepIcon} ${iconClass}`}>
                                {icon}
                            </div>
                            <Stack gap={0}>
                                <Group gap="xs" align="center">
                                    <span className={classes.stepLabel}>
                                        {step.label}
                                    </span>
                                </Group>
                                <span className={classes.stepStatusText}>
                                    {statusText}
                                </span>
                            </Stack>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
