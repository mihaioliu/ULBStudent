-- Professors table for ULBStudent
-- Department scope: Calculatoare si Inginerie Electrica
-- Safe to re-run after SUPABASE_PRODUCTION_SETUP.sql.

CREATE TABLE IF NOT EXISTS public.professors (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  academic_title TEXT NOT NULL,
  full_name TEXT NOT NULL,
  institutional_email TEXT NOT NULL UNIQUE,
  email TEXT,
  specialization TEXT NOT NULL CHECK (
    specialization IN (
      'Calculatoare',
      'Tehnologia Informatiei',
      'Ingineria Sistemelor Multimedia'
    )
  ),
  department TEXT NOT NULL DEFAULT 'Departamentul de Calculatoare si Inginerie Electrica',
  taught_subject TEXT,
  teaching_years TEXT[],
  rating NUMERIC(2,1) NOT NULL DEFAULT 4.6,
  reviews_count INT NOT NULL DEFAULT 0,
  courses_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE public.professors ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.professors ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.professors ADD COLUMN IF NOT EXISTS taught_subject TEXT;
ALTER TABLE public.professors ADD COLUMN IF NOT EXISTS teaching_years TEXT[];
ALTER TABLE public.professors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_seed_professors_user_id ON public.professors(user_id);
CREATE INDEX IF NOT EXISTS idx_seed_professors_email_lower ON public.professors(lower(coalesce(institutional_email, email)));

ALTER TABLE public.professors ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'professors' AND policyname = 'Allow read professors for all'
  ) THEN
    CREATE POLICY "Allow read professors for all" ON public.professors
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'professors' AND policyname = 'Allow insert professors for authenticated'
  ) THEN
    CREATE POLICY "Allow insert professors for authenticated" ON public.professors
      FOR INSERT WITH CHECK (
        auth.uid() = user_id
        OR EXISTS (
          SELECT 1 FROM public.utilizatori u
          WHERE u.user_id = auth.uid() AND u.role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'professors' AND policyname = 'Allow update professors for authenticated'
  ) THEN
    CREATE POLICY "Allow update professors for authenticated" ON public.professors
      FOR UPDATE USING (
        auth.uid() = user_id
        OR EXISTS (
          SELECT 1 FROM public.utilizatori u
          WHERE u.user_id = auth.uid() AND u.role = 'admin'
        )
      );
  END IF;
END $$;

INSERT INTO public.professors (academic_title, full_name, institutional_email, email, specialization) VALUES
('Prof. dr. ing.', 'Adrian Florea', 'adrian.florea@ulbsibiu.ro', 'adrian.florea@ulbsibiu.ro', 'Calculatoare'),
('Prof. dr. mat.', 'Adrian-Nicolae Branga', 'adrian.branga@ulbsibiu.ro', 'adrian.branga@ulbsibiu.ro', 'Calculatoare'),
('Asist. dr. ing.', 'Alexandru Dorobantiu', 'alexandru.dorobantiu@ulbsibiu.ro', 'alexandru.dorobantiu@ulbsibiu.ro', 'Calculatoare'),
('Sef lucr. dr. ing.', 'Andreea Maria Teodorescu', 'andreea.teodorescu@ulbsibiu.ro', 'andreea.teodorescu@ulbsibiu.ro', 'Calculatoare'),
('Sef lucr. dr. inf.', 'Antoniu-Gabriel Pitic', 'antoniu.pitic@ulbsibiu.ro', 'antoniu.pitic@ulbsibiu.ro', 'Calculatoare'),
('Conf. dr. ing.', 'Arpad Gellert', 'arpad.gellert@ulbsibiu.ro', 'arpad.gellert@ulbsibiu.ro', 'Calculatoare'),
('Prof. dr. ing.', 'Bala Constantin Zamfirescu', 'constantin.zamfirescu@ulbsibiu.ro', 'constantin.zamfirescu@ulbsibiu.ro', 'Calculatoare'),
('Prof. dr. fiz.', 'Dan Chicea', 'dan.chicea@ulbsibiu.ro', 'dan.chicea@ulbsibiu.ro', 'Calculatoare'),
('Asist. dr. ing.', 'Daniel Cristian Craciunean', 'daniel.craciunean@ulbsibiu.ro', 'daniel.craciunean@ulbsibiu.ro', 'Calculatoare'),
('Prof. dr. ing.', 'Daniel Volovici', 'daniel.volovici@ulbsibiu.ro', 'daniel.volovici@ulbsibiu.ro', 'Calculatoare'),
('Asist. dr. ing.', 'Dionisie Vladimir Turcu', 'dionisie.turcu@ulbsibiu.ro', 'dionisie.turcu@ulbsibiu.ro', 'Calculatoare'),
('Sef lucr. dr. ing.', 'Elena Catalina Neghina', 'catalina.neghina@ulbsibiu.ro', 'catalina.neghina@ulbsibiu.ro', 'Calculatoare'),
('Sef lucr. dr. mat.', 'Elisabeta Alina Totoi', 'elisabeta.totoi@ulbsibiu.ro', 'elisabeta.totoi@ulbsibiu.ro', 'Calculatoare'),
('Sef lucr. dr. ing.', 'Gabriela Craciunas', 'gabriela.craciunas@ulbsibiu.ro', 'gabriela.craciunas@ulbsibiu.ro', 'Calculatoare'),
('Sef lucr. dr. ing.', 'Ileana Ioana Cofaru', 'ioana.cofaru@ulbsibiu.ro', 'ioana.cofaru@ulbsibiu.ro', 'Calculatoare'),
('Conf. dr. mat.', 'Ioan Tincu', 'ioan.tincu@ulbsibiu.ro', 'ioan.tincu@ulbsibiu.ro', 'Calculatoare'),
('Prof. dr. ing.', 'Ion-Dan Mironescu', 'ion.mironescu@ulbsibiu.ro', 'ion.mironescu@ulbsibiu.ro', 'Calculatoare'),
('Conf. dr. ing.', 'Ionel Daniel Morariu', 'daniel.morariu@ulbsibiu.ro', 'daniel.morariu@ulbsibiu.ro', 'Calculatoare'),
('Conf. dr. ing.', 'Macarie Breazu', 'macarie.breazu@ulbsibiu.ro', 'macarie.breazu@ulbsibiu.ro', 'Calculatoare'),
('Prof. dr. ing.', 'Maria Vintan', 'maria.vintan@ulbsibiu.ro', 'maria.vintan@ulbsibiu.ro', 'Calculatoare'),
('Conf. dr. ing.', 'Mihai Bogdan', 'mihai.bogdan@ulbsibiu.ro', 'mihai.bogdan@ulbsibiu.ro', 'Calculatoare'),
('Asist. dr. ing.', 'Radu Chis', 'radu.chis@ulbsibiu.ro', 'radu.chis@ulbsibiu.ro', 'Calculatoare'),
('Conf. dr. mat.', 'Radu-George Cretulescu', 'radu.kretzulescu@ulbsibiu.ro', 'radu.kretzulescu@ulbsibiu.ro', 'Calculatoare'),
('Prof. dr. ing.', 'Remus Ovidiu Brad', 'remus.brad@ulbsibiu.ro', 'remus.brad@ulbsibiu.ro', 'Calculatoare'),
('Conf. dr. ing.', 'Rodica Baciu', 'rodica.baciu@ulbsibiu.ro', 'rodica.baciu@ulbsibiu.ro', 'Calculatoare'),
('Sef lucr. dr. ing.', 'Teodor Petru Tulpan', 'teodorpetru.tulpan@ulbsibiu.ro', 'teodorpetru.tulpan@ulbsibiu.ro', 'Calculatoare'),
('Conf. dr. ing.', 'Vasile Alexandru Butean', 'alexandru.butean@ulbsibiu.ro', 'alexandru.butean@ulbsibiu.ro', 'Calculatoare'),
('Conf. dr. ing.', 'Maria Miruna Diaconu (Pop Vesea)', 'miruna.diaconu@ulbsibiu.ro', 'miruna.diaconu@ulbsibiu.ro', 'Tehnologia Informatiei'),
('Sef lucr. dr. ing.', 'Eugen-Ioan Constantinescu', 'eugen.constantinescu@ulbsibiu.ro', 'eugen.constantinescu@ulbsibiu.ro', 'Tehnologia Informatiei'),
('Conf. dr. ing.', 'Mihai Neghina', 'mihai.neghina@ulbsibiu.ro', 'mihai.neghina@ulbsibiu.ro', 'Ingineria Sistemelor Multimedia')
ON CONFLICT (institutional_email) DO UPDATE
SET
  academic_title = EXCLUDED.academic_title,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  specialization = EXCLUDED.specialization,
  department = EXCLUDED.department,
  updated_at = NOW();
