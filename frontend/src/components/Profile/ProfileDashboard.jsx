import { Title, Group, Button, Modal, Stack } from '@mantine/core';
import { useState, useContext, useEffect } from 'react';
import classes from '../../styles/Account.module.css';
import { logoutUser, updateUserAvatar } from '../../utils/auth';
import { notifications } from '@mantine/notifications';
import AvatarSelector from './AvatarSelector';
import deltaruneCharacters from '../../assets/data/deltarune_characters.json';
import { getCharacterImage } from '../../utils/image.js';
import RankOverviewCard from './RankOverviewCard';
import { HelpWidgetContext } from '../../utils/HelpWidgetContext.js';

const defaultAvatar = deltaruneCharacters.find(c => c.name.toUpperCase() === 'KRIS')?.image || deltaruneCharacters[0]?.image || '';

export default function ProfileDashboard({ activeUser }) {
    const [isEditingAvatar, setIsEditingAvatar] = useState(false);

    const { setIsHelpWidgetHidden } = useContext(HelpWidgetContext);

    useEffect(() => {
        if (setIsHelpWidgetHidden) {
            setIsHelpWidgetHidden(isEditingAvatar);
        }
        return () => {
            if (setIsHelpWidgetHidden) {
                setIsHelpWidgetHidden(false);
            }
        };
    }, [isEditingAvatar, setIsHelpWidgetHidden]);

    const handleAvatarChange = (avatarUrl) => {
        updateUserAvatar(avatarUrl);
        setIsEditingAvatar(false);
        notifications.show({
            title: 'Avatar Updated',
            message: 'Your profile image has been updated!',
            color: 'royalMagenta',
        });
    };

    const getAvatarSrc = (url) => {
        return getCharacterImage(url || defaultAvatar);
    };

    return (
        <div>
            <div className={classes.dashboardHeader}>
                <Title order={1} className={classes.profileName}>
                    {activeUser.name}
                </Title>
                <div 
                    className={classes.avatarWrapper} 
                    onClick={() => setIsEditingAvatar(true)}
                    title="Click to change avatar"
                >
                    <img
                        src={getAvatarSrc(activeUser.avatar)}
                        alt={activeUser.name}
                        className={classes.profileAvatar}
                    />
                    <span className={classes.avatarBadge}>EDIT</span>
                </div>
            </div>

            <Modal
                opened={isEditingAvatar}
                onClose={() => setIsEditingAvatar(false)}
                title="Choose Avatar Sprite"
                centered
                size="md"
                styles={{
                    content: {
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: 'var(--size-2) solid var(--color-border-primary)',
                        color: 'var(--color-text-primary)',
                    },
                    header: {
                        backgroundColor: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-primary)',
                    },
                    title: {
                        fontFamily: 'var(--font-family-deltarune)',
                        fontSize: '1.2rem',
                    }
                }}
            >
                <AvatarSelector
                    selectedAvatar={activeUser.avatar}
                    onSelect={handleAvatarChange}
                />
            </Modal>

            <div className={classes.rankSectionWrapper}>
                <RankOverviewCard />
            </div>

            <Group justify="center" className={classes.logoutGroup}>
                <Button color="red" variant="outline" size="sm" className={classes.logoutBtn} onClick={logoutUser}>
                    Logout
                </Button>
            </Group>
        </div>
    );
}
