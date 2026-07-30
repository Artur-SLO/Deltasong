import { Stack } from '@mantine/core';
import { IconCheck, IconPlayerPlay, IconLock } from '@tabler/icons-react';
import classes from '../../styles/Daily.module.css';

export default function DailyStepper({ currentStep, status }) {
    const steps = [
        { id: 1, label: "Characters", desc: "Guess Character" },
        { id: 2, label: "Items", desc: "Guess Item" },
        { id: 3, label: "Song", desc: "Guess Song" }
    ];

    return (
        <div className={classes.stepperContainer}>
            <div className={classes.stepperTrack}>
                {steps.map((step) => {
                    const isCompleted = currentStep > step.id || status === 'victory' || (status === 'defeat' && currentStep > step.id);
                    const isActive = currentStep === step.id && status === 'playing';
                    
                    let stepClass = classes.stepPending;
                    let iconClass = classes.stepIconPending;
                    let icon = <IconLock size={14} />;
                    let statusText = "In Progress";

                    if (isCompleted) {
                        stepClass = classes.stepCompleted;
                        iconClass = classes.stepIconCompleted;
                        icon = <IconCheck size={14} />;
                    } else if (isActive) {
                        stepClass = classes.stepActive;
                        iconClass = classes.stepIconActive;
                        icon = <IconPlayerPlay size={14} />;
                    }

                    return (
                        <div key={step.id} className={`${classes.step} ${stepClass}`}>
                            <div className={`${classes.stepIcon} ${iconClass}`}>
                                {icon}
                            </div>
                            <Stack gap={0}>
                                <span className={classes.stepLabel}>
                                    {step.label}
                                </span>
                                <span className={classes.stepStatusText}>
                                    {isActive ? statusText : step.desc}
                                </span>
                            </Stack>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
