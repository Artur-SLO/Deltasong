import { Title, Group, Text, Button, Paper, Modal, Stack } from '@mantine/core';
import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router';
import classes from '../../styles/Account.module.css';
import { logoutUser, updateUserAvatar } from '../../utils/auth';
import { notifications } from '@mantine/notifications';
import AvatarSelector from './AvatarSelector';
import deltaruneCharacters from '../../assets/deltarune_characters.json';
import { getCharacterImage } from '../../utils/image.js';
import RankOverviewCard from './RankOverviewCard';
import { HelpWidgetContext } from '../../utils/HelpWidgetContext.js';

const defaultAvatar = deltaruneCharacters.find(c => c.name.toUpperCase() === 'KRIS')?.image || deltaruneCharacters[0]?.image || '';

export default function ProfileDashboard({ activeUser }) {
    const navigate = useNavigate();
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
            message: 'Your profile sprite has been updated!',
            color: 'royalMagenta',
        });
    };

    const getAvatarSrc = (url) => {
        return getCharacterImage(url || defaultAvatar);
    };

    return (
        <div>
            <div className={classes.dashboardHeader}>

                <Title order={1} mt="sm" className={classes.profileName}>
                    {activeUser.name}
                </Title>
                <img 
                    src={getAvatarSrc(activeUser.avatar)} 
                    alt={activeUser.name} 
                    className={classes.profileAvatar}
                    onClick={() => setIsEditingAvatar(true)}
                    title="Click to change avatar"
                />
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

            <Stack gap="xl" mt="xl" mb="xl">
                <RankOverviewCard />
            </Stack>

            <Group justify="center" mt="xl">
                <Button color="royalMagenta" variant="light" size="md" onClick={() => navigate('/')}>
                    Play Games
                </Button>
                <Button color="red" variant="outline" size="md" onClick={logoutUser}>
                    Logout
                </Button>
            </Group>
        </div>
    );
}
