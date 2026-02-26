import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Typography,
  Hero,
  H1,
  H2,
  H3,
  H4,
  Body,
  BodyLarge,
  BodySmall,
  Caption,
  Label,
  LabelSmall,
  ButtonText,
  ButtonTextLarge,
  ButtonTextSmall,
  Overline,
  Quote,
  Letter,
  Emphasis,
} from '../components/common/Typography';
import { colors } from '../theme';
import { useFonts } from '../hooks/useFonts';

/**
 * Typography Demo Screen
 * Displays all typography variants for testing and reference
 * 
 * Usage: Import in your navigator or main screen to verify fonts
 */
export const TypographyDemoScreen: React.FC = () => {
  const fontsLoaded = useFonts();

  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <Typography variant="body">Loading fonts...</Typography>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Overline color={colors.textSecondary}>Display & Headings</Overline>
        <Hero color={colors.primary}>Hero Display Text</Hero>
        <H1 color={colors.primary}>Heading 1 - Sentient Bold</H1>
        <H2 color={colors.primary}>Heading 2 - Sentient Medium</H2>
        <H3 color={colors.textPrimary}>Heading 3 - Sentient Medium</H3>
        <H4 color={colors.textPrimary}>Heading 4 - Switzer Semibold</H4>
      </View>

      <View style={styles.section}>
        <Overline color={colors.textSecondary}>Body Text</Overline>
        <BodyLarge>
          This is large body text using Sentient Regular. Perfect for
          introductions and important paragraphs.
        </BodyLarge>
        <Body>
          This is regular body text using Sentient Regular. It's the default
          text style for most content in the app. Readable and warm.
        </Body>
        <BodySmall color={colors.textSecondary}>
          This is small body text using Sentient Light. Great for secondary
          information and supporting details.
        </BodySmall>
      </View>

      <View style={styles.section}>
        <Overline color={colors.textSecondary}>Intimate Content</Overline>
        <Letter>
          Dear future self, this is letter text using Sentient Regular with
          increased letter spacing. Use this style for personal messages,
          journal entries, and intimate content. The warmth of Sentient brings
          humanity to written letters.
        </Letter>
        <Quote color={colors.textSecondary}>
          "This is a quote using Sentient Light Italic. Perfect for testimonials
          and pull quotes that need emphasis."
        </Quote>
        <Emphasis>
          This is emphasized text using Sentient Medium Italic for inline emphasis.
        </Emphasis>
      </View>

      <View style={styles.section}>
        <Overline color={colors.textSecondary}>UI Elements (Switzer)</Overline>
        <Label color={colors.textPrimary}>Label - Switzer Medium</Label>
        <Caption color={colors.textSecondary}>
          Caption text - Switzer Regular - Last updated 2 hours ago
        </Caption>
        <LabelSmall color={colors.textSecondary}>
          LABEL SMALL - SWITZER MEDIUM - BADGE TEXT
        </LabelSmall>
      </View>

      <View style={styles.section}>
        <Overline color={colors.textSecondary}>Buttons</Overline>
        <View style={[styles.button, styles.buttonPrimary]}>
          <ButtonTextLarge color={colors.white}>
            Primary Button - Switzer Semibold
          </ButtonTextLarge>
        </View>
        <View style={[styles.button, styles.buttonSecondary]}>
          <ButtonText color={colors.primary}>
            Secondary Button - Switzer Semibold
          </ButtonText>
        </View>
        <View style={[styles.button, styles.buttonSmall]}>
          <ButtonTextSmall color={colors.primary}>
            Small Button - Switzer Medium
          </ButtonTextSmall>
        </View>
      </View>

      <View style={styles.section}>
        <Overline color={colors.textSecondary}>Color Variants</Overline>
        <H2 color={colors.primary}>Ora Green (#1d473e)</H2>
        <H2 color={colors.secondary}>Lavender (#D4B8E8)</H2>
        <H2 color={colors.accent}>Accent Purple (#6B5B95)</H2>
        <H2 color={colors.golden}>Golden (#D4A574)</H2>
      </View>

      <View style={styles.section}>
        <Overline color={colors.textSecondary}>Mixed Content Example</Overline>
        <H2 color={colors.primary}>Welcome to Ora</H2>
        <Body>
          Ora combines the warmth of Sentient for personal content with the
          clarity of Switzer for interface elements.
        </Body>
        <BodySmall color={colors.textSecondary} style={{ marginTop: 8 }}>
          Typography system configured • Fonts loaded successfully
        </BodySmall>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

export default TypographyDemoScreen;
