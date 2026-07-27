import React from 'react';
import styles from './styles.module.css';

export function EduPasiTranscript({
  title = 'Transcriere',
  children,
  defaultOpen = true,
}) {
  return (
    <details
      className={styles.transcript}
      data-edupasi-transcript
      open={defaultOpen || undefined}
    >
      <summary>{title}</summary>
      <div className={styles.transcriptBody}>{children}</div>
    </details>
  );
}

export function EduPasiMedia({
  type = 'video',
  src,
  title,
  captionsSrc,
  captionsLabel = 'Română',
  poster,
  transcript,
  children,
}) {
  const isAudio = type === 'audio';

  return (
    <figure className={styles.media}>
      {title ? <figcaption className={styles.mediaTitle}>{title}</figcaption> : null}
      {isAudio ? (
        <audio controls preload="metadata" src={src} className={styles.player}>
          Browserul tău nu poate reda acest fișier audio.
        </audio>
      ) : (
        <video controls preload="metadata" src={src} poster={poster} className={styles.player}>
          {captionsSrc ? (
            <track
              kind="captions"
              src={captionsSrc}
              srcLang="ro"
              label={captionsLabel}
              default
            />
          ) : null}
          Browserul tău nu poate reda acest fișier video.
        </video>
      )}
      {transcript || children ? (
        <EduPasiTranscript>{transcript || children}</EduPasiTranscript>
      ) : null}
    </figure>
  );
}

export function EduPasiFigure({
  src,
  alt = '',
  caption,
  description,
  audioDescriptionSrc,
  decorative = false,
  defaultDescriptionOpen = false,
  children,
}) {
  const reactId = React.useId();
  const descriptionId = `edupasi-figure-description-${reactId.replace(/:/g, '')}`;
  const longDescription = description || children || alt;

  return (
    <figure className={styles.figure} data-edupasi-figure>
      <img
        src={src}
        alt={decorative ? '' : alt}
        aria-describedby={!decorative ? descriptionId : undefined}
        data-edupasi-decorative={decorative ? 'true' : undefined}
        className={styles.figureImage}
      />
      {caption ? <figcaption className={styles.figureCaption}>{caption}</figcaption> : null}
      {!decorative ? (
        <details
          className={styles.figureDescription}
          data-edupasi-visual-description
          open={defaultDescriptionOpen || undefined}
        >
          <summary>Descrierea imaginii</summary>
          <div className={styles.figureDescriptionBody}>
            <p id={descriptionId} data-edupasi-description-text>
              {longDescription || (
                <>
                  Imaginea nu are încă o descriere. Completează proprietatea
                  {' '}
                  <code>description</code>
                  {' '}
                  în lecția MDX.
                </>
              )}
            </p>
            {audioDescriptionSrc ? (
              <audio
                controls
                preload="metadata"
                src={audioDescriptionSrc}
                className={styles.audioDescription}
                aria-label="Descriere audio a imaginii"
              >
                Browserul tău nu poate reda descrierea audio.
              </audio>
            ) : null}
          </div>
        </details>
      ) : null}
    </figure>
  );
}
