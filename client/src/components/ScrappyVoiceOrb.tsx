"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Audio } from "expo-av";
import { GLView, ExpoWebGLRenderingContext } from "expo-gl";
import { Mic, MicOff, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ScrappyVoiceOrbProps {
  onClose: () => void;
}

/* ============================================================
   SHADERS
   ============================================================ */

const VERTEX_SHADER = `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_activity;

uniform vec3 u_base;
uniform vec3 u_light;
uniform vec3 u_dark;

float hash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);

  f = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(
      mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
      mix(hash(i + vec3(0.0, 1.0, 0.0)),
          hash(i + vec3(1.0, 1.0, 0.0)), f.x),
      f.y
    ),
    mix(
      mix(hash(i + vec3(0.0, 0.0, 1.0)),
          hash(i + vec3(1.0, 0.0, 1.0)), f.x),
      mix(hash(i + vec3(0.0, 1.0, 1.0)),
          hash(i + vec3(1.0, 1.0, 1.0)), f.x),
      f.y
    ),
    f.z
  );
}

float fbm(vec3 p) {
  return
      noise(p) * 0.57 +
      noise(p * 2.03 + 7.2) * 0.28 +
      noise(p * 4.07 + 3.1) * 0.15;
}

void main() {

  vec2 p =
    (gl_FragCoord.xy * 2.0 - u_resolution)
    / min(u_resolution.x, u_resolution.y);

  float t = u_time * 0.38;

  float angle = atan(p.y, p.x);

  /*
   * Organic breathing silhouette
   */
  float breath = sin(u_time * 1.4) * 0.008;

  /*
   * Multiple low-frequency waves create
   * the irregular liquid boundary.
   */
  float ripple =
      sin(angle * 3.0 + t * 2.1) * 0.55 +
      sin(angle * 5.0 - t * 1.7) * 0.30 +
      sin(angle * 2.0 + t) * 0.15;

  p /=
      0.91 +
      breath +
      u_activity * 0.040 +
      ripple * (0.004 + u_activity * 0.036);

  float r2 = dot(p, p);

  float aa =
      3.0 / min(u_resolution.x, u_resolution.y);

  float alpha =
      1.0 - smoothstep(1.0 - aa, 1.0, r2);

  if (alpha <= 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  /*
   * Treat the flat circle as a sphere.
   */
  vec3 normal = vec3(
    p,
    sqrt(max(0.0, 1.0 - r2))
  );

  /*
   * Liquid flow coordinates.
   */
  vec3 flow =
      vec3(
        normal.xy * 1.65,
        normal.z * 1.4
      );

  flow.xy +=
      vec2(
        sin(normal.y * 2.6 + t),
        cos(normal.x * 2.3 - t * 0.8)
      )
      * (0.25 + u_activity * 0.34);

  /*
   * Domain warp.
   */
  vec3 warp =
      vec3(
        noise(flow + vec3(0.0, t, t * 0.3)),
        noise(flow + vec3(4.7, -t * 0.7, t)),
        noise(flow + vec3(t * 0.5, 9.2, -t))
      ) - 0.5;

  /*
   * Liquid pigment field.
   */
  float pigment =
      fbm(
        flow +
        warp * 1.4 +
        vec3(
          t * 0.3,
          -t * 0.2,
          t * 0.4
        )
      );

  /*
   * Large flowing folds.
   */
  float fold =
      normal.x * 0.50 +
      normal.y * 0.32 +
      sin(normal.y * 2.6 - t) * 0.30 +
      (pigment - 0.5) * 0.65;

  float shadow =
      smoothstep(-0.30, 0.42, fold);

  /*
   * Main orange -> green material.
   */
  vec3 color =
      mix(
        u_dark,
        u_base,
        shadow
      );

  /*
   * Cream pigment.
   */
  color =
      mix(
        color,
        u_light,
        smoothstep(0.40, 0.82, pigment) * 0.34
      );

  /*
   * Sphere lighting.
   */
  float diffuse =
      max(
        0.0,
        dot(
          normal,
          normalize(vec3(-0.4, 0.65, 1.0))
        )
      );

  color *=
      0.64 +
      0.46 * diffuse;

  /*
   * Cream liquid shine.
   */
  float shine =
      exp(
        -pow(
          (fold + 0.06) * 8.0,
          2.0
        )
      )
      * pow(normal.z, 0.65);

  /*
   * Inner warm/cream illumination.
   */
  float innerLight =
      exp(
        -pow(
          (fold - 0.28) * 4.0,
          2.0
        )
      )
      * normal.z;

  color =
      mix(
        color,
        u_light,
        innerLight *
        (0.18 + u_activity * 0.16)
      );

  /*
   * Bright flowing highlight.
   */
  color =
      mix(
        color,
        mix(
          u_light,
          vec3(1.0),
          0.55
        ),
        shine * 0.78
      );

  /*
   * Specular highlight.
   */
  float gleam =
      pow(
        max(
          0.0,
          dot(
            normal,
            normalize(vec3(-0.45, 0.55, 1.0))
          )
        ),
        24.0
      );

  color += gleam * 0.16;

  /*
   * Soft edge/rim.
   */
  float rim =
      pow(
        1.0 - normal.z,
        3.0
      );

  color =
      mix(
        color,
        u_light,
        rim *
        (0.36 + 0.25 * max(0.0, -normal.x))
      );

  /*
   * Subtle film grain.
   */
  float grain =
      hash(
        vec3(
          gl_FragCoord.xy,
          1.0
        )
      ) - 0.5;

  color += grain * 0.032;

  gl_FragColor =
      vec4(
        clamp(color, 0.0, 1.0),
        alpha
      );
}
`;

/* ============================================================
   HELPERS
   ============================================================ */

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.replace("#", ""), 16);

  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

/* ============================================================
   ORB
   ============================================================ */

function ScrappyOrbGL({
  activity,
}: {
  activity: Animated.Value;
}) {
  const activityValue = useRef(0);

  useEffect(() => {
    const id = activity.addListener(({ value }) => {
      activityValue.current = value;
    });

    return () => {
      activity.removeListener(id);
    };
  }, [activity]);

  const onContextCreate = async (
    gl: ExpoWebGLRenderingContext
  ) => {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);

    gl.shaderSource(vertexShader, VERTEX_SHADER);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(fragmentShader, FRAGMENT_SHADER);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.useProgram(program);

    /*
     * Full-screen quad.
     */
    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,

        -1,  1,
         1, -1,
         1,  1,
      ]),
      gl.STATIC_DRAW
    );

    const position = gl.getAttribLocation(
      program,
      "a_position"
    );

    gl.enableVertexAttribArray(position);

    gl.vertexAttribPointer(
      position,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );

    /*
     * Uniforms.
     */
    const resolution = gl.getUniformLocation(
      program,
      "u_resolution"
    );

    const time = gl.getUniformLocation(
      program,
      "u_time"
    );

    const activityUniform = gl.getUniformLocation(
      program,
      "u_activity"
    );

    const base = gl.getUniformLocation(
      program,
      "u_base"
    );

    const light = gl.getUniformLocation(
      program,
      "u_light"
    );

    const dark = gl.getUniformLocation(
      program,
      "u_dark"
    );

    /*
     * IMPORTANT:
     * This is the original VoiceOrb palette.
     *
     * Orange
     * Cream
     * Dark green
     */
    const baseColor = hexToRgb("#e8754d");
    const lightColor = hexToRgb("#ffe0ac");
    const darkColor = hexToRgb("#346b52");

    gl.uniform3fv(base, baseColor);
    gl.uniform3fv(light, lightColor);
    gl.uniform3fv(dark, darkColor);

    gl.enable(gl.BLEND);

    gl.blendFunc(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA
    );

    const start = Date.now();

    const render = () => {
      const elapsed =
        (Date.now() - start) / 1000;

      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;

      gl.viewport(
        0,
        0,
        width,
        height
      );

      gl.clearColor(
        0,
        0,
        0,
        0
      );

      gl.clear(
        gl.COLOR_BUFFER_BIT
      );

      gl.uniform2f(
        resolution,
        width,
        height
      );

      gl.uniform1f(
        time,
        elapsed
      );

      gl.uniform1f(
        activityUniform,
        activityValue.current
      );

      gl.drawArrays(
        gl.TRIANGLES,
        0,
        6
      );

      gl.endFrameEXP();

      requestAnimationFrame(render);
    };

    render();
  };

  return (
    <GLView
      style={StyleSheet.absoluteFill}
      onContextCreate={onContextCreate}
    />
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function ScrappyVoiceOrb({
  onClose,
}: ScrappyVoiceOrbProps) {
  const [isListening, setIsListening] =
    useState(false);

  const [isStarting, setIsStarting] =
    useState(false);

  const [message, setMessage] =
    useState(
      "Tap the orb to start talking"
    );

  const insets =
    useSafeAreaInsets();

  const recording =
    useRef<Audio.Recording | null>(null);

  const activityValue =
    useRef(0);

  /*
   * Holds real microphone activity for the shader.
   */
  const activity =
    useRef(
      new Animated.Value(0)
    ).current;

  useEffect(() => {
    return () => {
      if (recording.current) {
        recording.current
          .stopAndUnloadAsync()
          .catch(() => undefined);
      }
    };
  }, []);

  /* ============================================================
     START
     ============================================================ */

  const startListening =
    async () => {
      if (
        isListening ||
        isStarting
      ) {
        return;
      }

      setIsStarting(true);

      setMessage(
        "Getting Scrappy ready…"
      );

      try {
        const permission =
          await Audio.requestPermissionsAsync();

        if (!permission.granted) {
          setMessage(
            "Microphone access is needed to talk to Scrappy"
          );

          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const result =
          await Audio.Recording.createAsync(
            {
              ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
              isMeteringEnabled: true,
            },
            (status) => {
              if (!status.isRecording) return;

              const db = status.metering;
              if (
                typeof db !== "number" ||
                !Number.isFinite(db)
              ) {
                return;
              }

              const MIN_DB = -55;
              let normalized =
                (db - MIN_DB) / (0 - MIN_DB);

              normalized = Math.max(
                0,
                Math.min(1, normalized)
              );

              normalized = Math.pow(
                normalized,
                0.65
              );

              const previous =
                activityValue.current;

              const smoothing =
                normalized > previous
                  ? 0.32
                  : 0.12;

              const smoothed =
                previous +
                (normalized - previous) *
                  smoothing;

              activityValue.current =
                smoothed;

              activity.setValue(smoothed);
            },
            50
          );

        recording.current =
          result.recording;

        setIsListening(true);

        setMessage(
          "Listening… tell me what you need"
        );

      } catch {
        setMessage(
          "I couldn’t access the microphone. You can still write to me."
        );
      } finally {
        setIsStarting(false);
      }
    };

  /* ============================================================
     STOP
     ============================================================ */

  const stopListening =
    async () => {
      if (recording.current) {
        await recording.current
          .stopAndUnloadAsync()
          .catch(() => undefined);
      }

      recording.current =
        null;

      activityValue.current =
        0;

      Animated.timing(activity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }).start();

      setIsListening(false);

      setMessage(
        "I’m ready for your next question"
      );
    };

  /*
   * Keep the orb slightly smaller than
   * the current implementation.
   */
  const orbSize =
    Math.min(
      SCREEN_WIDTH - 116,
      340
    );

  return (
    <View
      style={styles.overlay}
    >
      {/* ========================================================
          CLOSE BUTTON
         ======================================================== */}

      <TouchableOpacity
        style={[
          styles.dismiss,
          {
            top:
              Math.max(
                insets.top + 52,
                58
              ),
          },
        ]}
        onPress={onClose}
        accessibilityLabel="Close voice assistant"
      >
        <X
          size={25}
          color="#E8EDF7"
          strokeWidth={2}
        />
      </TouchableOpacity>

      {/* ========================================================
          TITLE AREA
         ======================================================== */}

      <Text style={styles.eyebrow}>
        SCRAPPY VOICE
      </Text>

      <Text style={styles.title}>
        {isListening
          ? "I’m listening"
          : "Talk to Scrappy"}
      </Text>

      <Text style={styles.subtitle}>
        {message}
      </Text>

      {/* ========================================================
          ORB
         ======================================================== */}

      <TouchableOpacity
        onPress={
          isListening
            ? stopListening
            : startListening
        }
        activeOpacity={0.96}
        accessibilityRole="button"
        accessibilityLabel={
          isListening
            ? "Stop listening"
            : "Start voice input"
        }
        style={[
          styles.orbTouchable,
          {
            width: orbSize,
            height: orbSize,
          },
        ]}
      >
        {/* soft ambient glow */}
        <View
          pointerEvents="none"
          style={[
            styles.orbGlow,
            {
              width:
                orbSize * 0.94,
              height:
                orbSize * 0.94,
              borderRadius:
                orbSize / 2,
            },
          ]}
        />

        {/* actual procedural liquid orb */}
        <View
          style={[
            styles.orb,
            {
              width: orbSize,
              height: orbSize,
              borderRadius:
                orbSize / 2,
            },
          ]}
        >
          <ScrappyOrbGL
            activity={activity}
          />

          {/* microphone stays above shader */}
          <View
            pointerEvents="none"
            style={styles.iconContainer}
          >
            {isStarting ? (
              <ActivityIndicator
                size="small"
                color="#20362D"
              />
            ) : isListening ? (
              <MicOff
                size={35}
                color="#20362D"
                strokeWidth={2.3}
              />
            ) : (
              <Mic
                size={35}
                color="#20362D"
                strokeWidth={2.3}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* ========================================================
          FOOTER
         ======================================================== */}

      <Text style={styles.hint}>
        {isListening
          ? "Tap to stop"
          : "Tap the orb to speak"}
      </Text>
    </View>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,

    zIndex: 50,

    backgroundColor:
      "#080F25",

    alignItems: "center",

    paddingTop: 224,
  },

  dismiss: {
    position: "absolute",

    right: 22,

    width: 56,
    height: 56,

    borderRadius: 28,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor:
      "rgba(105,119,151,0.28)",
  },

  eyebrow: {
    color: "#B4C8FF",

    fontSize: 12,

    fontWeight: "800",

    letterSpacing: 2.4,
  },

  title: {
    color: "#FFFFFF",

    fontSize: 48,

    lineHeight: 56,

    fontWeight: "900",

    marginTop: 36,

    letterSpacing: -1.6,
  },

  subtitle: {
    color: "#D4DDFF",

    fontSize: 23,

    lineHeight: 29,

    textAlign: "center",

    marginTop: 28,

    paddingHorizontal: 34,

    minHeight: 58,
  },

  orbTouchable: {
    marginTop: 28,

    alignItems: "center",
    justifyContent: "center",

    position: "relative",
  },

  orbGlow: {
    position: "absolute",

    backgroundColor:
      "rgba(231,117,77,0.10)",

    shadowColor:
      "#E8754D",

    shadowOpacity:
      0.35,

    shadowRadius:
      42,

    shadowOffset: {
      width: 0,
      height: 0,
    },

    elevation: 15,
  },

  orb: {
    overflow: "hidden",

    backgroundColor:
      "transparent",

    borderWidth: 1,

    borderColor:
      "rgba(255,224,172,0.55)",

    shadowColor:
      "#000000",

    shadowOpacity:
      0.35,

    shadowRadius:
      24,

    shadowOffset: {
      width: 0,
      height: 12,
    },

    elevation: 15,

    alignItems: "center",
    justifyContent: "center",
  },

  iconContainer: {
    position: "absolute",

    width: 68,
    height: 68,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 34,

    backgroundColor:
      "rgba(255,224,172,0.10)",
  },

  hint: {
    color: "#C2CEFF",

    fontSize: 23,

    fontWeight: "800",

    marginTop: 38,
  },
});
