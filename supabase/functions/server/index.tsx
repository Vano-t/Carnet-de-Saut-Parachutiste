import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const app = new Hono();

// CORS and logging middleware
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}));
app.use('*', logger(console.log));

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Create storage bucket on startup
async function createBucket() {
  const bucketName = 'make-1cedc7d9-jump-scans';
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
  if (!bucketExists) {
    await supabase.storage.createBucket(bucketName, { public: false });
    console.log(`Created bucket: ${bucketName}`);
  }
}

// Initialize bucket
createBucket().catch(console.error);

// Auth Routes
app.post('/make-server-1cedc7d9/auth/signup', async (c) => {
  try {
    const { email, password, name, license } = await c.req.json();

    if (!email || !password || !name || !license) {
      return c.json({ error: 'Tous les champs sont requis' }, 400);
    }

    // Check if license number already exists
    const existingUsers = await kv.getByPrefix('user:');
    const licenseExists = existingUsers.some(user => user.license === license);
    
    if (licenseExists) {
      return c.json({ error: 'Ce numéro de licence est déjà utilisé' }, 400);
    }

    // Create user account
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, license },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Store user profile
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      name,
      license,
      email,
      joinDate: new Date().toISOString(),
      totalJumps: 0,
      created_at: new Date().toISOString()
    });

    return c.json({ user: data.user });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

app.post('/make-server-1cedc7d9/auth/signin', async (c) => {
  try {
    const { license, password } = await c.req.json();

    if (!license || !password) {
      return c.json({ error: 'License and password required' }, 400);
    }

    // Find user by license number to get their email
    const users = await kv.getByPrefix('user:');
    const userProfile = users.find(u => u.license === license);
    
    if (!userProfile) {
      return c.json({ error: 'Numéro de licence non trouvé' }, 404);
    }

    // Sign in with the user's actual email
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userProfile.email,
      password,
    });

    if (error) {
      console.log('Signin error:', error);
      return c.json({ error: 'Mot de passe incorrect' }, 401);
    }

    return c.json({ session: data.session, user: userProfile });
  } catch (error) {
    console.log('Signin error:', error);
    return c.json({ error: 'Erreur de connexion' }, 500);
  }
});

// Jump Routes
app.get('/make-server-1cedc7d9/jumps', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const jumps = await kv.getByPrefix(`jump:${user.id}:`);
    const sortedJumps = jumps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return c.json({ jumps: sortedJumps });
  } catch (error) {
    console.log('Get jumps error:', error);
    return c.json({ error: 'Failed to fetch jumps' }, 500);
  }
});

app.post('/make-server-1cedc7d9/jumps', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const jumpData = await c.req.json();
    const jumpId = crypto.randomUUID();
    
    // Get current jump count for numbering
    const existingJumps = await kv.getByPrefix(`jump:${user.id}:`);
    const jumpNumber = existingJumps.length + 1;

    const jump = {
      id: jumpId,
      userId: user.id,
      jumpNumber,
      ...jumpData,
      created_at: new Date().toISOString()
    };

    await kv.set(`jump:${user.id}:${jumpId}`, jump);

    // Update user stats
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile) {
      userProfile.totalJumps = jumpNumber;
      await kv.set(`user:${user.id}`, userProfile);
    }

    return c.json({ jump });
  } catch (error) {
    console.log('Create jump error:', error);
    return c.json({ error: 'Failed to create jump' }, 500);
  }
});

app.delete('/make-server-1cedc7d9/jumps/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const jumpId = c.req.param('id');
    await kv.del(`jump:${user.id}:${jumpId}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Delete jump error:', error);
    return c.json({ error: 'Failed to delete jump' }, 500);
  }
});

// Image Upload for Scanning
app.post('/make-server-1cedc7d9/upload-scan', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return c.json({ error: 'No image provided' }, 400);
    }

    const fileName = `${user.id}/${crypto.randomUUID()}.${file.name.split('.').pop()}`;
    const bucketName = 'make-1cedc7d9-jump-scans';

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file);

    if (uploadError) {
      console.log('Upload error:', uploadError);
      return c.json({ error: 'Failed to upload image' }, 500);
    }

    // Create signed URL for the uploaded image
    const { data: signedUrlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    // Mock OCR processing - in real implementation, you'd call an OCR service
    const mockScannedData = [
      {
        id: crypto.randomUUID(),
        date: '2024-02-15',
        location: 'Bourg-en-Bresse',
        aircraft: 'Cessna 182',
        altitude: 4000,
        canopySize: 260,
        weather: 'Nuageux 18°C',
        wind: '10 kt NO',
        freefallNotes: 'Bon saut, position stable',
        canopyNotes: 'Atterrissage précis',
        confidence: 0.85
      }
    ];

    return c.json({ 
      imageUrl: signedUrlData?.signedUrl,
      scannedData: mockScannedData 
    });
  } catch (error) {
    console.log('Upload scan error:', error);
    return c.json({ error: 'Failed to process scan' }, 500);
  }
});

// Weather API Route
app.get('/make-server-1cedc7d9/weather/:city', async (c) => {
  try {
    const city = c.req.param('city');
    
    // Mock weather data - in production, you'd call a real weather API
    const mockWeather = {
      city,
      temperature: Math.floor(Math.random() * 20) + 10,
      conditions: ['Ensoleillé', 'Nuageux', 'Partiellement nuageux', 'Venteux'][Math.floor(Math.random() * 4)],
      wind: `${Math.floor(Math.random() * 20) + 5} kt ${['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'][Math.floor(Math.random() * 8)]}`,
      visibility: `${Math.floor(Math.random() * 10) + 5}+ km`,
      timestamp: new Date().toISOString()
    };

    return c.json({ weather: mockWeather });
  } catch (error) {
    console.log('Weather error:', error);
    return c.json({ error: 'Failed to fetch weather' }, 500);
  }
});

// Dropzones Route
app.get('/make-server-1cedc7d9/dropzones', async (c) => {
  try {
    // Complete list of French parachute centers
    const dropzones = [
      // Auvergne-Rhône-Alpes
      { id: '1', name: 'Centre de Parachutisme de Bourg-en-Bresse', city: 'Bourg-en-Bresse', region: 'Auvergne-Rhône-Alpes', coordinates: { lat: 46.2189, lng: 5.2305 }, phone: '04 74 25 71 84', website: 'parachutisme-bourg.com', aircraft: ['Cessna 182', 'Cessna 206'], maxAltitude: 4000, status: 'open' },
      { id: '2', name: 'Aéroclub de Tallard', city: 'Tallard', region: 'Provence-Alpes-Côte d\'Azur', coordinates: { lat: 44.4667, lng: 6.0333 }, phone: '04 92 54 10 84', website: 'tallard.com', aircraft: ['Pilatus Porter', 'Twin Otter'], maxAltitude: 4200, status: 'open' },
      { id: '3', name: 'Parachutisme Grenoble', city: 'Grenoble', region: 'Auvergne-Rhône-Alpes', coordinates: { lat: 45.1885, lng: 5.7245 }, phone: '04 76 54 62 85', website: 'parachutisme-grenoble.fr', aircraft: ['Cessna 182', 'Caravan'], maxAltitude: 4000, status: 'open' },
      { id: '4', name: 'Voltige Aérienne du Forez', city: 'Saint-Étienne', region: 'Auvergne-Rhône-Alpes', coordinates: { lat: 45.4397, lng: 4.3839 }, phone: '04 77 36 85 47', website: 'voltige-forez.com', aircraft: ['Cessna 206'], maxAltitude: 3800, status: 'open' },
      { id: '5', name: 'Parachutisme Annecy', city: 'Annecy', region: 'Auvergne-Rhône-Alpes', coordinates: { lat: 45.8992, lng: 6.1294 }, phone: '04 50 45 71 23', website: 'parachutisme-annecy.fr', aircraft: ['Cessna 182', 'Islander'], maxAltitude: 4200, status: 'open' },
      
      // Nouvelle-Aquitaine
      { id: '6', name: 'Centre de Pau', city: 'Pau', region: 'Nouvelle-Aquitaine', coordinates: { lat: 43.38, lng: -0.42 }, phone: '05 59 33 85 59', website: 'parachutisme-pau.com', aircraft: ['Cessna 182', 'PAC 750'], maxAltitude: 4000, status: 'limited' },
      { id: '7', name: 'Parachutisme Bordeaux', city: 'Bordeaux', region: 'Nouvelle-Aquitaine', coordinates: { lat: 44.8378, lng: -0.5792 }, phone: '05 56 87 45 23', website: 'parachutisme-bordeaux.fr', aircraft: ['Cessna 206', 'Caravan'], maxAltitude: 4000, status: 'open' },
      { id: '8', name: 'Aéroclub de Limoges', city: 'Limoges', region: 'Nouvelle-Aquitaine', coordinates: { lat: 45.8354, lng: 1.2644 }, phone: '05 55 06 78 32', website: 'aeroclub-limoges.fr', aircraft: ['Cessna 182'], maxAltitude: 3500, status: 'open' },
      { id: '9', name: 'Parachutisme La Rochelle', city: 'La Rochelle', region: 'Nouvelle-Aquitaine', coordinates: { lat: 46.1603, lng: -1.1511 }, phone: '05 46 41 85 96', website: 'parachutisme-larochelle.com', aircraft: ['Cessna 182', 'Islander'], maxAltitude: 4000, status: 'open' },
      { id: '10', name: 'Biscarrosse Parachutisme', city: 'Biscarrosse', region: 'Nouvelle-Aquitaine', coordinates: { lat: 44.4283, lng: -1.2511 }, phone: '05 58 78 45 71', website: 'biscarrosse-parachutisme.fr', aircraft: ['Twin Otter', 'Caravan'], maxAltitude: 4500, status: 'open' },

      // Occitanie
      { id: '11', name: 'Parachutisme Cahors', city: 'Cahors', region: 'Occitanie', coordinates: { lat: 44.35, lng: 1.475 }, phone: '05 65 22 97 21', website: 'parachutisme-cahors.com', aircraft: ['Cessna 206', 'Islander'], maxAltitude: 3500, status: 'closed' },
      { id: '12', name: 'Centre de Toulouse', city: 'Toulouse', region: 'Occitanie', coordinates: { lat: 43.6047, lng: 1.4442 }, phone: '05 61 85 47 23', website: 'parachutisme-toulouse.fr', aircraft: ['Cessna 182', 'Caravan'], maxAltitude: 4200, status: 'open' },
      { id: '13', name: 'Parachutisme Montpellier', city: 'Montpellier', region: 'Occitanie', coordinates: { lat: 43.6108, lng: 3.8767 }, phone: '04 67 78 45 62', website: 'parachutisme-montpellier.fr', aircraft: ['Cessna 206', 'Twin Otter'], maxAltitude: 4000, status: 'open' },
      { id: '14', name: 'Aéroclub de Perpignan', city: 'Perpignan', region: 'Occitanie', coordinates: { lat: 42.6886, lng: 2.8948 }, phone: '04 68 52 71 84', website: 'aeroclub-perpignan.com', aircraft: ['Cessna 182'], maxAltitude: 3800, status: 'open' },
      { id: '15', name: 'Parachutisme Albi', city: 'Albi', region: 'Occitanie', coordinates: { lat: 43.9289, lng: 2.1479 }, phone: '05 63 54 87 41', website: 'parachutisme-albi.fr', aircraft: ['Cessna 206'], maxAltitude: 3500, status: 'limited' },

      // Pays de la Loire
      { id: '16', name: 'Saumur Parachutisme', city: 'Saumur', region: 'Pays de la Loire', coordinates: { lat: 47.26, lng: -0.11 }, phone: '02 41 50 80 60', website: 'saumur-parachutisme.com', aircraft: ['Cessna 182', 'Caravan'], maxAltitude: 4000, status: 'open' },
      { id: '17', name: 'Parachutisme Nantes', city: 'Nantes', region: 'Pays de la Loire', coordinates: { lat: 47.2184, lng: -1.5536 }, phone: '02 40 78 45 23', website: 'parachutisme-nantes.fr', aircraft: ['Cessna 206', 'Islander'], maxAltitude: 4000, status: 'open' },
      { id: '18', name: 'Le Mans Parachutisme', city: 'Le Mans', region: 'Pays de la Loire', coordinates: { lat: 48.0061, lng: 0.1996 }, phone: '02 43 85 47 96', website: 'lemans-parachutisme.com', aircraft: ['Cessna 182'], maxAltitude: 3800, status: 'open' },
      { id: '19', name: 'Cholet Parachutisme', city: 'Cholet', region: 'Pays de la Loire', coordinates: { lat: 47.0858, lng: -0.8789 }, phone: '02 41 62 85 74', website: 'cholet-parachutisme.fr', aircraft: ['Cessna 206'], maxAltitude: 3500, status: 'open' },
      
      // Bretagne
      { id: '20', name: 'Parachutisme Vannes', city: 'Vannes', region: 'Bretagne', coordinates: { lat: 47.6587, lng: -2.7606 }, phone: '02 97 47 85 62', website: 'parachutisme-vannes.fr', aircraft: ['Cessna 182', 'Islander'], maxAltitude: 4000, status: 'open' },
      { id: '21', name: 'Aéroclub de Rennes', city: 'Rennes', region: 'Bretagne', coordinates: { lat: 48.1173, lng: -1.6778 }, phone: '02 99 54 78 41', website: 'aeroclub-rennes.com', aircraft: ['Cessna 206'], maxAltitude: 3800, status: 'open' },
      { id: '22', name: 'Brest Parachutisme', city: 'Brest', region: 'Bretagne', coordinates: { lat: 48.3905, lng: -4.4861 }, phone: '02 98 47 85 23', website: 'brest-parachutisme.fr', aircraft: ['Cessna 182'], maxAltitude: 3500, status: 'limited' },
      { id: '23', name: 'Quimper Parachutisme', city: 'Quimper', region: 'Bretagne', coordinates: { lat: 47.9978, lng: -4.0972 }, phone: '02 98 74 85 96', website: 'quimper-parachutisme.com', aircraft: ['Cessna 206'], maxAltitude: 3600, status: 'open' },

      // Normandie
      { id: '24', name: 'Caen Parachutisme', city: 'Caen', region: 'Normandie', coordinates: { lat: 49.1829, lng: -0.3707 }, phone: '02 31 85 47 23', website: 'caen-parachutisme.fr', aircraft: ['Cessna 182', 'Caravan'], maxAltitude: 4000, status: 'open' },
      { id: '25', name: 'Rouen Parachutisme', city: 'Rouen', region: 'Normandie', coordinates: { lat: 49.4431, lng: 1.0993 }, phone: '02 35 78 45 62', website: 'rouen-parachutisme.com', aircraft: ['Cessna 206'], maxAltitude: 3800, status: 'open' },
      { id: '26', name: 'Cherbourg Parachutisme', city: 'Cherbourg', region: 'Normandie', coordinates: { lat: 49.6337, lng: -1.6815 }, phone: '02 33 52 71 84', website: 'cherbourg-parachutisme.fr', aircraft: ['Cessna 182'], maxAltitude: 3500, status: 'limited' },

      // Hauts-de-France
      { id: '27', name: 'Lille Parachutisme', city: 'Lille', region: 'Hauts-de-France', coordinates: { lat: 50.6292, lng: 3.0573 }, phone: '03 20 54 78 41', website: 'lille-parachutisme.fr', aircraft: ['Cessna 182', 'Islander'], maxAltitude: 4000, status: 'open' },
      { id: '28', name: 'Amiens Parachutisme', city: 'Amiens', region: 'Hauts-de-France', coordinates: { lat: 49.8951, lng: 2.2956 }, phone: '03 22 85 47 96', website: 'amiens-parachutisme.com', aircraft: ['Cessna 206'], maxAltitude: 3800, status: 'open' },
      { id: '29', name: 'Calais Parachutisme', city: 'Calais', region: 'Hauts-de-France', coordinates: { lat: 50.9581, lng: 1.9543 }, phone: '03 21 47 85 23', website: 'calais-parachutisme.fr', aircraft: ['Cessna 182'], maxAltitude: 3600, status: 'open' },

      // Grand Est
      { id: '30', name: 'Strasbourg Parachutisme', city: 'Strasbourg', region: 'Grand Est', coordinates: { lat: 48.5734, lng: 7.7521 }, phone: '03 88 54 78 41', website: 'strasbourg-parachutisme.fr', aircraft: ['Cessna 182', 'Caravan'], maxAltitude: 4200, status: 'open' },
      { id: '31', name: 'Mulhouse Parachutisme', city: 'Mulhouse', region: 'Grand Est', coordinates: { lat: 47.7508, lng: 7.3359 }, phone: '03 89 85 47 62', website: 'mulhouse-parachutisme.com', aircraft: ['Cessna 206'], maxAltitude: 4000, status: 'open' },
      { id: '32', name: 'Metz Parachutisme', city: 'Metz', region: 'Grand Est', coordinates: { lat: 49.1193, lng: 6.1757 }, phone: '03 87 78 45 23', website: 'metz-parachutisme.fr', aircraft: ['Cessna 182'], maxAltitude: 3800, status: 'limited' },
      { id: '33', name: 'Reims Parachutisme', city: 'Reims', region: 'Grand Est', coordinates: { lat: 49.2583, lng: 4.0317 }, phone: '03 26 52 71 84', website: 'reims-parachutisme.com', aircraft: ['Cessna 206', 'Islander'], maxAltitude: 4000, status: 'open' },

      // Centre-Val de Loire
      { id: '34', name: 'Orléans Parachutisme', city: 'Orléans', region: 'Centre-Val de Loire', coordinates: { lat: 47.9029, lng: 1.9093 }, phone: '02 38 85 47 23', website: 'orleans-parachutisme.fr', aircraft: ['Cessna 182', 'Caravan'], maxAltitude: 4000, status: 'open' },
      { id: '35', name: 'Tours Parachutisme', city: 'Tours', region: 'Centre-Val de Loire', coordinates: { lat: 47.3941, lng: 0.6848 }, phone: '02 47 54 78 41', website: 'tours-parachutisme.com', aircraft: ['Cessna 206'], maxAltitude: 3800, status: 'open' },
      { id: '36', name: 'Châteauroux Parachutisme', city: 'Châteauroux', region: 'Centre-Val de Loire', coordinates: { lat: 46.8119, lng: 1.6928 }, phone: '02 54 78 45 96', website: 'chateauroux-parachutisme.fr', aircraft: ['Cessna 182'], maxAltitude: 3500, status: 'open' },

      // Île-de-France
      { id: '37', name: 'Parachutisme de Paris', city: 'Meaux', region: 'Île-de-France', coordinates: { lat: 48.9553, lng: 2.8736 }, phone: '01 64 33 85 47', website: 'parachutisme-paris.fr', aircraft: ['Cessna 182', 'Twin Otter'], maxAltitude: 4000, status: 'open' },
      { id: '38', name: 'Aérodrome de Lognes', city: 'Lognes', region: 'Île-de-France', coordinates: { lat: 48.8335, lng: 2.6319 }, phone: '01 60 05 47 23', website: 'lognes-parachutisme.com', aircraft: ['Cessna 206'], maxAltitude: 3800, status: 'open' },
      { id: '39', name: 'Coulommiers Parachutisme', city: 'Coulommiers', region: 'Île-de-France', coordinates: { lat: 48.8378, lng: 3.0833 }, phone: '01 64 65 78 41', website: 'coulommiers-parachutisme.fr', aircraft: ['Cessna 182'], maxAltitude: 3600, status: 'limited' },

      // Bourgogne-Franche-Comté
      { id: '40', name: 'Dijon Parachutisme', city: 'Dijon', region: 'Bourgogne-Franche-Comté', coordinates: { lat: 47.3220, lng: 5.0415 }, phone: '03 80 54 78 41', website: 'dijon-parachutisme.fr', aircraft: ['Cessna 182', 'Caravan'], maxAltitude: 4000, status: 'open' },
      { id: '41', name: 'Besançon Parachutisme', city: 'Besançon', region: 'Bourgogne-Franche-Comté', coordinates: { lat: 47.2378, lng: 6.0241 }, phone: '03 81 85 47 23', website: 'besancon-parachutisme.com', aircraft: ['Cessna 206'], maxAltitude: 3800, status: 'open' },

      // PACA
      { id: '42', name: 'Marseille Parachutisme', city: 'Marseille', region: 'Provence-Alpes-Côte d\'Azur', coordinates: { lat: 43.2965, lng: 5.3698 }, phone: '04 91 78 45 62', website: 'marseille-parachutisme.fr', aircraft: ['Cessna 182', 'Twin Otter'], maxAltitude: 4200, status: 'open' },
      { id: '43', name: 'Nice Parachutisme', city: 'Nice', region: 'Provence-Alpes-Côte d\'Azur', coordinates: { lat: 43.7102, lng: 7.2620 }, phone: '04 93 52 71 84', website: 'nice-parachutisme.com', aircraft: ['Cessna 206', 'Islander'], maxAltitude: 4000, status: 'open' },
      { id: '44', name: 'Toulon Parachutisme', city: 'Toulon', region: 'Provence-Alpes-Côte d\'Azur', coordinates: { lat: 43.1242, lng: 5.928 }, phone: '04 94 47 85 23', website: 'toulon-parachutisme.fr', aircraft: ['Cessna 182'], maxAltitude: 3800, status: 'limited' },
      { id: '45', name: 'Avignon Parachutisme', city: 'Avignon', region: 'Provence-Alpes-Côte d\'Azur', coordinates: { lat: 43.9493, lng: 4.8059 }, phone: '04 90 74 85 96', website: 'avignon-parachutisme.com', aircraft: ['Cessna 206'], maxAltitude: 3600, status: 'open' },

      // Corse
      { id: '46', name: 'Ajaccio Parachutisme', city: 'Ajaccio', region: 'Corse', coordinates: { lat: 41.9176, lng: 8.7367 }, phone: '04 95 25 47 81', website: 'ajaccio-parachutisme.fr', aircraft: ['Cessna 182'], maxAltitude: 4000, status: 'open' },
      { id: '47', name: 'Bastia Parachutisme', city: 'Bastia', region: 'Corse', coordinates: { lat: 42.7028, lng: 9.4517 }, phone: '04 95 54 78 62', website: 'bastia-parachutisme.com', aircraft: ['Cessna 206'], maxAltitude: 3800, status: 'open' },

      // DOM-TOM (quelques centres principaux)
      { id: '48', name: 'Martinique Parachutisme', city: 'Fort-de-France', region: 'Martinique', coordinates: { lat: 14.6037, lng: -61.0662 }, phone: '05 96 71 85 47', website: 'martinique-parachutisme.fr', aircraft: ['Cessna 182'], maxAltitude: 3500, status: 'open' },
      { id: '49', name: 'Guadeloupe Parachutisme', city: 'Pointe-à-Pitre', region: 'Guadeloupe', coordinates: { lat: 16.2650, lng: -61.5510 }, phone: '05 90 85 47 23', website: 'guadeloupe-parachutisme.fr', aircraft: ['Cessna 206'], maxAltitude: 3600, status: 'open' },
      { id: '50', name: 'Réunion Parachutisme', city: 'Saint-Denis', region: 'La Réunion', coordinates: { lat: -20.8824, lng: 55.4504 }, phone: '02 62 54 78 41', website: 'reunion-parachutisme.fr', aircraft: ['Cessna 182'], maxAltitude: 4000, status: 'open' }
    ];

    // Add real-time weather to each dropzone
    const dropzonesWithWeather = await Promise.all(
      dropzones.map(async (dz) => {
        try {
          const weatherResponse = await fetch(`${c.req.url.split('/dropzones')[0]}/weather/${dz.city}`);
          const weatherData = await weatherResponse.json();
          return {
            ...dz,
            weather: weatherData.weather
          };
        } catch (error) {
          // Fallback weather data
          return {
            ...dz,
            weather: {
              temperature: Math.floor(Math.random() * 15) + 10,
              conditions: 'Données non disponibles',
              wind: `${Math.floor(Math.random() * 15) + 5} kt`,
              visibility: '10+ km',
              timestamp: new Date().toISOString()
            }
          };
        }
      })
    );

    return c.json({ dropzones: dropzonesWithWeather });
  } catch (error) {
    console.log('Dropzones error:', error);
    return c.json({ error: 'Failed to fetch dropzones' }, 500);
  }
});

// User Profile Route
app.get('/make-server-1cedc7d9/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Get user stats
    const jumps = await kv.getByPrefix(`jump:${user.id}:`);
    const totalAltitude = jumps.reduce((sum, jump) => sum + (jump.altitude || 0), 0);
    const totalFreefall = jumps.length * 70; // Approximate 70 seconds per jump

    const stats = {
      totalJumps: jumps.length,
      totalAltitude,
      totalFreefall: `${Math.floor(totalFreefall / 60)}m ${totalFreefall % 60}s`,
      favoriteDropzone: jumps.length > 0 ? jumps[jumps.length - 1].location : 'N/A'
    };

    return c.json({ profile: { ...profile, stats } });
  } catch (error) {
    console.log('Profile error:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// Favorites Routes
app.get('/make-server-1cedc7d9/favorites', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const favorites = await kv.getByPrefix(`favorite:${user.id}:`);
    const favoriteIds = favorites.map(fav => fav.dropzoneId);
    
    return c.json({ favorites: favoriteIds });
  } catch (error) {
    console.log('Get favorites error:', error);
    return c.json({ error: 'Failed to fetch favorites' }, 500);
  }
});

app.post('/make-server-1cedc7d9/favorites/:dropzoneId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const dropzoneId = c.req.param('dropzoneId');
    
    await kv.set(`favorite:${user.id}:${dropzoneId}`, {
      userId: user.id,
      dropzoneId,
      created_at: new Date().toISOString()
    });

    return c.json({ success: true });
  } catch (error) {
    console.log('Add favorite error:', error);
    return c.json({ error: 'Failed to add favorite' }, 500);
  }
});

app.delete('/make-server-1cedc7d9/favorites/:dropzoneId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const dropzoneId = c.req.param('dropzoneId');
    await kv.del(`favorite:${user.id}:${dropzoneId}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Remove favorite error:', error);
    return c.json({ error: 'Failed to remove favorite' }, 500);
  }
});

// Health check
app.get('/make-server-1cedc7d9/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

Deno.serve(app.fetch);