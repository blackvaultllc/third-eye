import React from "react";
import { StyleSheet, View } from "react-native";

/**
 * Glowing third eye, drawn with Views (no image asset, no SVG dependency).
 * Keep the glow subtle on purpose: heavy glows/particles drain a phone
 * battery, and this logo renders on every screen.
 */
export function ThirdEyeLogo({ size = 96 }: { size?: number }) {
  const iris = size * 0.42;
  return (
    <View style={[styles.eye, { width: size * 1.7, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.iris, { width: iris, height: iris, borderRadius: iris / 2 }]}>
        <View style={styles.pupil} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  eye: {
    alignItems: "center",
    backgroundColor: "#0b1020",
    borderColor: "#22d3ee",
    borderWidth: 2,
    justifyContent: "center",
    shadowColor: "#22d3ee",
    shadowOpacity: 0.8,
    shadowRadius: 18,
    elevation: 10,
  },
  iris: {
    alignItems: "center",
    backgroundColor: "#22d3ee",
    justifyContent: "center",
    shadowColor: "#22d3ee",
    shadowOpacity: 0.9,
    shadowRadius: 12,
  },
  pupil: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#020617" },
});
