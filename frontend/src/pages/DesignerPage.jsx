
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useEffect, useState } from 'react';
import {
  catalogueService,
  projectService,
  designService
} from '../services/services';
import { useAuth } from '../context/AuthContext';
import './DesignerPage.css';

function Furniture({ item, selected, onSelect }) {
  const colors = [
    '#b78b64',
    '#6e7865',
    '#b6a38e',
    '#81756a',
    '#d0bfa8'
  ];

  return (
    <mesh
      position={item.position}
      rotation={[0, item.rotation || 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item.id);
      }}
      castShadow
      receiveShadow
    >
      <boxGeometry args={item.size || [1, 0.7, 0.7]} />
      <meshStandardMaterial
        color={
          selected
            ? '#c18a55'
            : colors[item.colorIndex % colors.length]
        }
      />
    </mesh>
  );
}

function RoomScene({
  length,
  width,
  items,
  selected,
  onSelect,
  pov,
  cameraKey
}) {
  return (
    <>
      <ambientLight intensity={1.2} />

      <directionalLight
        position={[4, 7, 5]}
        intensity={2}
        castShadow
      />

      {/* Room floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        receiveShadow
      >
        <planeGeometry args={[length, width]} />
        <meshStandardMaterial color="#d8c7b1" />
      </mesh>

      {/* Room walls */}
      <mesh position={[0, 1.4, -width / 2]}>
        <boxGeometry args={[length, 2.8, 0.08]} />
        <meshStandardMaterial color="#f1e9dd" />
      </mesh>

      <mesh position={[-length / 2, 1.4, 0]}>
        <boxGeometry args={[0.08, 2.8, width]} />
        <meshStandardMaterial color="#e5d8c8" />
      </mesh>

      <mesh position={[length / 2, 1.4, 0]}>
        <boxGeometry args={[0.08, 2.8, width]} />
        <meshStandardMaterial color="#e5d8c8" />
      </mesh>

      {/* Furniture */}
      {items.map((item) => (
        <Furniture
          key={item.id}
          item={item}
          selected={selected === item.id}
          onSelect={onSelect}
        />
      ))}

      <PerspectiveCamera
        key={cameraKey}
        makeDefault
        position={
          pov
            ? [0, 1.65, width / 2 - 0.5]
            : [length * 0.85, length * 0.9, width * 1.15]
        }
        fov={pov ? 75 : 50}
      />

      <OrbitControls
        key={`orbit-${cameraKey}`}
        makeDefault
        enabled={!pov}
        enableRotate={!pov}
        enableZoom={!pov}
        enablePan={!pov}
        minDistance={1.5}
        maxDistance={25}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2.02}
        target={[0, 0.6, 0]}
      />
    </>
  );
}

export default function DesignerPage() {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [project, setProject] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [catalogue, setCatalogue] = useState([]);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pov, setPov] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    projectService.list()
      .then(setProjects)
      .catch((e) => setMessage(e.message));

    catalogueService.list()
      .then(setCatalogue)
      .catch((e) => setMessage(e.message));
  }, []);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setRoomId('');
      return;
    }

    projectService.get(projectId)
      .then((p) => {
        setProject(p);
        setRoomId(p.rooms?.length ? String(p.rooms[0].id) : '');
      })
      .catch((e) => setMessage(e.message));
  }, [projectId]);

  const room = project?.rooms?.find(
    (r) => String(r.id) === String(roomId)
  );

  const length = Math.max(0.5, Number(room?.length_m || 5));
  const width = Math.max(0.5, Number(room?.width_m || 4));

  const selectedItem = items.find(
    (item) => item.id === selected
  );

  function addProduct(product) {
    const size = [
      Math.min(Number(product.length_m) || 1, 2.5),
      Math.min(Number(product.height_m) || 0.7, 2.2),
      Math.min(Number(product.width_m) || 0.7, 2.5)
    ];

    const newItem = {
      id: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      size,
      position: [
        (Math.random() - 0.5) * length * 0.55,
        size[1] / 2,
        (Math.random() - 0.5) * width * 0.55
      ],
      rotation: 0,
      colorIndex: items.length
    };

    setItems((old) => [...old, newItem]);
    setSelected(newItem.id);
    setMessage(`${product.name} added to the room.`);
  }

  function updateSelected(update) {
    setItems((old) =>
      old.map((item) =>
        item.id === selected ? update(item) : item
      )
    );
  }

  function moveFurniture(axis, distance) {
    if (!selectedItem) return;

    updateSelected((item) => {
      const position = [...item.position];
      const halfSize = axis === 0 ? item.size[0] / 2 : item.size[2] / 2;
      const limit = (axis === 0 ? length : width) / 2 - halfSize;

      position[axis] = Math.max(
        -Math.max(0, limit),
        Math.min(Math.max(0, limit), position[axis] + distance)
      );

      return { ...item, position };
    });
  }

  function rotateFurniture(direction) {
    updateSelected((item) => ({
      ...item,
      rotation: (item.rotation || 0) + direction * (Math.PI / 12)
    }));
  }

  function resizeFurniture(factor) {
    updateSelected((item) => ({
      ...item,
      size: item.size.map((value) =>
        Math.max(0.1, Math.min(5, value * factor))
      )
    }));
  }

  function duplicateFurniture() {
    if (!selectedItem) return;

    const copy = {
      ...selectedItem,
      id: crypto.randomUUID(),
      position: [
        Math.max(
          -length / 2 + 0.2,
          Math.min(length / 2 - 0.2, selectedItem.position[0] + 0.5)
        ),
        selectedItem.position[1],
        Math.max(
          -width / 2 + 0.2,
          Math.min(width / 2 - 0.2, selectedItem.position[2] + 0.5)
        )
      ]
    };

    setItems((old) => [...old, copy]);
    setSelected(copy.id);
    setMessage('Furniture duplicated.');
  }

  function deleteFurniture() {
    if (!selected) return;

    setItems((old) => old.filter((item) => item.id !== selected));
    setSelected(null);
    setMessage('Furniture removed from the design.');
  }

  function resetCamera() {
    setCameraKey((key) => key + 1);
  }

  async function save() {
    if (!projectId || !roomId) {
      setMessage('Select a project and a room first.');
      return;
    }

    try {
      const result = await designService.save({
        projectId: Number(projectId),
        roomId: Number(roomId),
        name: `Design ${new Date().toLocaleDateString()}`,
        scene: { length, width, items }
      });

      setMessage(`Design saved as version ${result.versionNo}.`);
    } catch (e) {
      setMessage(e.message);
    }
  }

  const total = items.reduce(
    (sum, item) => sum + item.price,
    0
  );

  return (
    <section className="page designer-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">SPATIAL PLANNING</p>
          <h1>3D room designer</h1>
          <p>
            Place furniture, adjust its position and inspect the room
            from different angles.
          </p>
        </div>

        <div className="designer-actions">
          <button
            className="btn btn-outline"
            onClick={() => setPov((value) => !value)}
          >
            {pov ? 'Exit POV' : 'Enter POV'}
          </button>

          <button
            className="btn btn-outline"
            onClick={resetCamera}
          >
            Reset camera
          </button>

          <button className="btn btn-dark" onClick={save}>
            Save design version
          </button>
        </div>
      </div>

      {message && <p className="notice">{message}</p>}

      <div className="designer-layout">
        <aside className="designer-sidebar">
          <label>
            Project
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setItems([]);
                setSelected(null);
                setMessage('');
              }}
            >
              <option value="">Choose project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            Room
            <select
              value={roomId}
              onChange={(e) => {
                setRoomId(e.target.value);
                setItems([]);
                setSelected(null);
              }}
            >
              <option value="">Choose room</option>
              {(project?.rooms || []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>

          <div className="room-size">
            <strong>ROOM DIMENSIONS</strong>
            <span>{length}m × {width}m</span>
            <small>
              Confirm actual measurements before final approval.
            </small>
          </div>

          <h3>Furniture catalogue</h3>

          {catalogue.map((product) => (
            <button
              className="catalogue-pick"
              key={product.id}
              onClick={() => addProduct(product)}
            >
              <span>
                <b>{product.name}</b>
                <small>
                  {product.category} · {product.length_m} ×
                  {product.width_m} × {product.height_m}m
                </small>
              </span>

              <strong>
                ₹{Number(product.price).toLocaleString('en-IN')}
              </strong>

              <i>+</i>
            </button>
          ))}

          {!catalogue.length && (
            <p className="muted">
              Catalogue is empty or unavailable.
            </p>
          )}

          <div className="scene-total">
            <span>Furniture estimate</span>
            <strong>₹{total.toLocaleString('en-IN')}</strong>
            <small>
              Estimate excludes taxes, labour and delivery.
            </small>
          </div>
        </aside>

        <div className="scene-panel">
          <div className="scene-toolbar">
            <span>
              ROOM VIEW / {pov ? 'FIRST PERSON' : '3D ORBIT'}
            </span>
            <span>{items.length} objects</span>
          </div>

          <div className="scene-canvas">
            <Canvas
              shadows
              onPointerMissed={() => setSelected(null)}
            >
              <color attach="background" args={['#eae4da']} />

              <RoomScene
                length={length}
                width={width}
                items={items}
                selected={selected}
                onSelect={setSelected}
                pov={pov}
                cameraKey={cameraKey}
              />
            </Canvas>
          </div>

          <div className="scene-bottom">
            <span>Click furniture to select it</span>
            <span>
              Drag to orbit · Scroll to zoom · Right-drag to pan
            </span>
          </div>

          {selectedItem && (
            <div className="selected-controls">
              <strong>{selectedItem.name || 'Selected furniture'}</strong>

              <div className="control-group">
                <span>Move</span>
                <button
                  className="btn btn-outline"
                  onClick={() => moveFurniture(0, -0.2)}
                >
                  ← Left
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => moveFurniture(0, 0.2)}
                >
                  Right →
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => moveFurniture(2, -0.2)}
                >
                  ↑ Forward
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => moveFurniture(2, 0.2)}
                >
                  ↓ Backward
                </button>
              </div>

              <div className="control-group">
                <span>Rotate</span>
                <button
                  className="btn btn-outline"
                  onClick={() => rotateFurniture(-1)}
                >
                  ↶ Rotate left
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => rotateFurniture(1)}
                >
                  ↷ Rotate right
                </button>
              </div>

              <div className="control-group">
                <span>Size</span>
                <button
                  className="btn btn-outline"
                  onClick={() => resizeFurniture(0.9)}
                >
                  − Smaller
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => resizeFurniture(1.1)}
                >
                  + Bigger
                </button>
              </div>

              <div className="control-group">
                <button
                  className="btn btn-outline"
                  onClick={duplicateFurniture}
                >
                  Duplicate
                </button>
                <button
                  className="btn btn-outline"
                  onClick={deleteFurniture}
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="notice">
        This is a procedural 3D planning preview. Real furniture models,
        photo-to-3D reconstruction and collision detection are not
        implemented by this update.
      </p>
    </section>
  );
}
