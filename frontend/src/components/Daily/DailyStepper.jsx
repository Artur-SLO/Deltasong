import { Stack, Group } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import classes from '../../styles/Daily.module.css';

import pinkGif from '../../assets/pink.gif';
import jackensteinGif from '../../assets/jackenstein.gif';

const lockedMascots = {
    1: pinkGif,
    2: "https://deltarune.wiki/images/Seam_face.gif?cb=0ngjb8&h=thumb.php&f=Seam_face.gif",
    3: jackensteinGif
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
                    let icon = (
                        <img 
                            src={lockedMascots[step.id]} 
                            alt="Mascot" 
                            className={classes.lockedStepperMascot} 
                        />
                    );
                    let statusText = "In Progress";

                    if (isCompleted) {
                        stepClass = classes.stepCompleted;
                        iconClass = classes.stepIconCompleted;
                        icon = <IconCheck size={20} />;
                    } else if (isActive) {
                        stepClass = classes.stepActive;
                        iconClass = classes.stepIconActive;
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
