import { Stack, Group } from '@mantine/core';
import { IconCheck, IconPlayerPlay, IconLock } from '@tabler/icons-react';
import classes from '../../styles/Daily.module.css';

import berdlyGif from '../../assets/berdly.gif';
import rouxlsGif from '../../assets/rouxls.gif';
import jevilGif from '../../assets/jevil.gif';

const mascots = {
    1: berdlyGif,
    2: rouxlsGif,
    3: jevilGif
};

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
                                <Group gap="xs" align="center">
                                    <span className={classes.stepLabel}>
                                        {step.label}
                                    </span>
                                    {isActive && (
                                        <img 
                                            src={mascots[step.id]} 
                                            alt={step.label} 
                                            className={classes.stepperMascot} 
                                        />
                                    )}
                                </Group>
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
