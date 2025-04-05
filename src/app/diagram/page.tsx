'use client';

import { useEffect, useRef } from 'react';
import styles from './page.module.css';
import NavBar from '../../components/NavBar';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('Loading BPMN script...');

    const script = document.createElement('script');
    script.src = '/bpmn-modeler/app.js';
    script.async = true;
    script.onload = () => {
      console.log('Script loaded');
      const dropZone = document.querySelector('#js-drop-zone');
      if (dropZone && containerRef.current) {
        console.log('Moving drop zone to container');
        containerRef.current.appendChild(dropZone);
        const canvas = document.querySelector('#js-canvas');
        if (canvas) {
          canvas.style.height = '600px';
          console.log('Canvas height set');
        }
      } else {
        console.error('Drop zone or container not found');
      }
    };
    script.onerror = (e) => {
      console.error('Failed to load script:', e);
    };
    document.body.appendChild(script);

    return () => {
      console.log('Cleaning up script');
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="page-container">
      {/* Include Header */}
      <NavBar />
      <main className={styles.main}>
        <h1>BPMN Modeler Integration</h1>
        <div className={styles.container}>
          <div ref={containerRef} className={styles.modelerContainer}>
            <div id="js-drop-zone" className="content">
              <div className="message intro">
                <div className="note">
                  Drop BPMN diagram from your desktop or{' '}
                  <a id="js-create-diagram" href="#">
                    create a new diagram
                  </a>{' '}
                  to get started.
                </div>
              </div>
              <div className="message error">
                <div className="note">
                  <p>Ooops, we could not display the BPMN 2.0 diagram.</p>
                  <div className="details">
                    <span>cause of the problem</span>
                    <pre></pre>
                  </div>
                </div>
              </div>
              <div className="canvas" id="js-canvas"></div>
            </div>
          </div>
          <ul className="buttons">
            <li>download</li>
            <li>
              <a id="js-download-diagram" href="#" title="download BPMN diagram">
                BPMN diagram
              </a>
            </li>
            <li>
              <a id="js-download-svg" href="#" title="download as SVG image">
                SVG image
              </a>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}