import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

interface AuthLinkProps {
  text: string;
  onPress: () => void;
}

export const AuthLink: React.FC<AuthLinkProps> = ({ text, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.link}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  link: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
});
