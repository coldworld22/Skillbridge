exports.up = function (knex) {
  return knex.schema.raw(`
    CREATE OR REPLACE FUNCTION check_class_capacity() RETURNS TRIGGER AS $$
    DECLARE
      enrolled_count integer;
      max_cap integer;
    BEGIN
      IF NEW.status = 'cancelled' THEN
        RETURN NEW;
      END IF;

      SELECT COUNT(*) INTO enrolled_count
      FROM class_enrollments
      WHERE class_id = NEW.class_id AND status <> 'cancelled';

      SELECT max_students INTO max_cap
      FROM online_classes
      WHERE id = NEW.class_id;

      IF max_cap IS NOT NULL AND enrolled_count > max_cap THEN
        RAISE EXCEPTION 'Class is full';
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE CONSTRAINT TRIGGER class_capacity_check
    AFTER INSERT OR UPDATE ON class_enrollments
    DEFERRABLE INITIALLY IMMEDIATE
    FOR EACH ROW
    EXECUTE FUNCTION check_class_capacity();
  `);
};

exports.down = function (knex) {
  return knex.schema.raw(`
    DROP TRIGGER IF EXISTS class_capacity_check ON class_enrollments;
    DROP FUNCTION IF EXISTS check_class_capacity;
  `);
};

