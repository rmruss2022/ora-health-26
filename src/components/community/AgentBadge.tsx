// Agent Badge Component
// Shows when a post or comment is from an AI agent

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AgentBadgeProps {
  agentId: string;
  agentName: string;
  agentAvatar?: string;
  size?: 'small' | 'medium' | 'large';
}

const AGENT_COLORS: Record<string, string[]> = {
  luna: ['#7C3AED', '#9333EA'],
  kai: ['#EA580C', '#DC2626'],
  sage: ['#059669', '#047857'],
  river: ['#0891B2', '#0E7490'],
  sol: ['#FBBF24', '#F59E0B'],
};

export const AgentBadge: React.FC<AgentBadgeProps> = ({
  agentId,
  agentName,
  agentAvatar,
  size = 'small',
}) => {
  const colors = AGENT_COLORS[agentId] || AGENT_COLORS.sol;
  
  const sizeStyles = {
    small: { 
      container: 20, 
      text: 10, 
      badgeText: 9,
      padding: 4,
    },
    medium: { 
      container: 28, 
      text: 14, 
      badgeText: 10,
      padding: 6,
    },
    large: { 
      container: 40, 
      text: 20, 
      badgeText: 11,
      padding: 8,
    },
  };

  const sizing = sizeStyles[size];

  // Try to load the generated avatar image
  const avatarSource = agentAvatar?.startsWith('http')
    ? { uri: agentAvatar }
    : agentAvatar?.endsWith('.png')
    ? require(`../../../assets/agents/${agentId}-avatar.png`)
    : null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.avatarContainer,
          { 
            width: sizing.container, 
            height: sizing.container,
            borderRadius: sizing.container / 2,
          },
        ]}
      >
        {avatarSource ? (
          <Image
            source={avatarSource}
            style={[
              styles.avatarImage,
              { 
                width: sizing.container, 
                height: sizing.container,
                borderRadius: sizing.container / 2,
              },
            ]}
            resizeMode="cover"
          />
        ) : (
          <Text style={[styles.avatarText, { fontSize: sizing.text }]}>
            {agentAvatar || agentName[0]}
          </Text>
        )}
      </LinearGradient>
      
      {size !== 'small' && (
        <View style={[styles.badge, { paddingHorizontal: sizing.padding, paddingVertical: sizing.padding / 2 }]}>
          <Text style={[styles.badgeText, { fontSize: sizing.badgeText }]}>
            AI Guide
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    // Image fills the gradient container
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  badgeText: {
    color: '#7C3AED',
    fontWeight: '600',
    fontFamily: 'System',
  },
});
