import { Title, Group, Text, Button, Paper, Modal } from '@mantine/core';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import classes from '../../styles/Account.module.css';
import { logoutUser, updateUserAvatar } from '../../utils/auth';
import { notifications } from '@mantine/notifications';
import AvatarSelector from './AvatarSelector';
import deltaruneCharacters from '../../assets/deltarune_characters.json';

const defaultAvatar = deltaruneCharacters.find(c => c.name.toUpperCase() === 'KRIS')?.image || deltaruneCharacters[0]?.image || '';

export default function ProfileDashboard({ activeUser }) {
    const navigate = useNavigate();
    const [isEditingAvatar, setIsEditingAvatar] = useState(false);

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
        return url || defaultAvatar;
    };

    return (
        <div>
            <div className={classes.dashboardHeader} style={{ justifyContent: 'center', flexDirection: 'column' }}>
                <img 
                    src={getAvatarSrc(activeUser.avatar)} 
                    alt={activeUser.name} 
                    className={classes.profileAvatar}
                    onClick={() => setIsEditingAvatar(true)}
                    title="Click to change avatar"
                />
                <Title order={1} mt="sm" style={{ fontSize: '2rem' }}>
                    {activeUser.name}
                </Title>
            </div>

            <Modal
                opened={isEditingAvatar}
                onClose={() => setIsEditingAvatar(false)}
                title="Choose Avatar Sprite"
                centered
                size="md"
                styles={{
                    content: {
                        backgroundColor: '#1f0f33',
                        border: '2px solid #381f54',
                        color: '#f0f0f0',
                    },
                    header: {
                        backgroundColor: '#1f0f33',
                        color: '#f0f0f0',
                    },
                    title: {
                        fontFamily: 'Deltarune, sans-serif',
                        fontSize: '1.2rem',
                    }
                }}
            >
                <AvatarSelector 
                    selectedAvatar={activeUser.avatar}
                    onSelect={handleAvatarChange}
                />
            </Modal>

            <Group justify="center" mt="xl" mb="xl" style={{ flexDirection: 'column', gap: 5 }}>
                <div className={classes.streakNumber}>
                    STREAK: {activeUser.streak}
                </div>
            </Group>

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
